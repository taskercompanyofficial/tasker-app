import { useState } from "react";
import { AxiosProgressEvent, AxiosResponse, AxiosError } from "axios";
import myAxios from "@/lib/axios.config";

type FormDataConvertible = string | number | boolean | null | undefined;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Progress = { percentage: number };

interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: Record<string, string | string[]>;
}

interface ApiErrorResponse {
  errors?: Record<string, string | string[]>;
  message?: string;
}

type VisitOptions<TForm, TResponse> = {
  onStart?: () => void;
  onFinish?: () => void;
  onSuccess?: (response: TResponse & { message?: string }) => void;
  onError?: (error: {
    message: string;
    errors?: Record<string, string | string[]>;
  }) => void;
  preserveState?: boolean;
  parseResponse?: (response: TResponse) => ApiResponse<TForm>;
  validateErrors?: (errors: Record<string, string>) => boolean;
};

type FormDataType = object;
type setDataByObject<TForm> = (data: TForm) => void;
type setDataByMethod<TForm> = (data: (previousData: TForm) => TForm) => void;
type setDataByKeyValuePair<TForm> = <K extends keyof TForm>(
  key: K,
  value: TForm[K]
) => void;

export interface InertiaFormProps<TForm extends FormDataType> {
  data: TForm;
  isDirty: boolean;
  errors: Partial<Record<keyof TForm, string>>;
  hasErrors: boolean;
  processing: boolean;
  progress: Progress | null;
  wasSuccessful: boolean;
  recentlySuccessful: boolean;
  setData: setDataByObject<TForm> &
    setDataByMethod<TForm> &
    setDataByKeyValuePair<TForm>;
  transform: (callback: (data: TForm) => TForm) => void;
  setDefaults(): void;
  setDefaults(field: keyof TForm, value: FormDataConvertible): void;
  setDefaults(fields: Partial<TForm>): void;
  reset: (...fields: (keyof TForm)[]) => void;
  clearErrors: (...fields: (keyof TForm)[]) => void;
  setError(field: keyof TForm, value: string): void;
  setError(errors: Record<keyof TForm, string>): void;
  submit: <TResponse>(
    method: Method,
    url: string,
    options?: VisitOptions<TForm, TResponse>,
    token?: string
  ) => Promise<void>;
  get: <TResponse>(
    url: string,
    options?: VisitOptions<TForm, TResponse>,
    token?: string
  ) => Promise<void>;
  patch: <TResponse>(
    url: string,
    options?: VisitOptions<TForm, TResponse>,
    token?: string
  ) => Promise<void>;
  post: <TResponse>(
    url: string,
    options?: VisitOptions<TForm, TResponse>,
    token?: string
  ) => Promise<void>;
  put: <TResponse>(
    url: string,
    options?: VisitOptions<TForm, TResponse>,
    token?: string
  ) => Promise<void>;
  delete: <TResponse>(
    url: string,
    options?: VisitOptions<TForm, TResponse>,
    token?: string
  ) => Promise<void>;
  cancel: () => void;
}

export default function useForm<TForm extends FormDataType>(
  initialValues: TForm
): InertiaFormProps<TForm> {
  const [data, setData] = useState<TForm>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TForm, string>>>(
    {}
  );
  const [processing, setProcessing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [wasSuccessful, setWasSuccessful] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);
  const handleSetData: setDataByObject<TForm> &
    setDataByMethod<TForm> &
    setDataByKeyValuePair<TForm> = (
    keyOrUpdater: TForm | keyof TForm | ((previousData: TForm) => TForm),
    value?: TForm[keyof TForm]
  ) => {
    if (typeof keyOrUpdater === "function") {
      setData((prevData) => {
        setIsDirty(true);
        return keyOrUpdater(prevData);
      });
    } else if (typeof keyOrUpdater === "string" && value !== undefined) {
      setData((prevData) => {
        setIsDirty(true);
        return { ...prevData, [keyOrUpdater]: value };
      });
    } else {
      setData(() => {
        setIsDirty(true);
        return keyOrUpdater as TForm;
      });
    }
  };

  const handleSubmit = async <TResponse>(
    method: Method,
    url: string,
    options: VisitOptions<TForm, TResponse> = {},
    token?: string
  ): Promise<void> => {
    setProcessing(true);
    setErrors({});
    if (options.onStart) options.onStart();

    try {
      let submissionData: TForm | FormData = data;

      // Helper to check if value is a React Native file object
      const isReactNativeFile = (value: any) => {
        return (
          value &&
          typeof value === "object" &&
          "uri" in value &&
          "name" in value &&
          "type" in value
        );
      };

      // Check if any value is a File or React Native file object
      const hasFiles = Object.values(data).some(
        (value) =>
          value instanceof File ||
          isReactNativeFile(value) ||
          (Array.isArray(value) &&
            value.some(
              (item) => item instanceof File || isReactNativeFile(item)
            ))
      );

      if (hasFiles) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(data)) {
          if (value instanceof File || isReactNativeFile(value)) {
            formData.append(key, value as any);
          } else if (Array.isArray(value)) {
            // Handle arrays of files
            if (
              value.some(
                (item) => item instanceof File || isReactNativeFile(item)
              )
            ) {
              value.forEach((file, index) => {
                if (file instanceof File || isReactNativeFile(file)) {
                  formData.append(`${key}[]`, file as any);
                }
              });
            } else {
              // Handle other array types
              value.forEach((item) => {
                if (item !== null && item !== undefined) {
                  formData.append(`${key}[]`, item.toString());
                }
              });
            }
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        }
        submissionData = formData;
      }

      const response: AxiosResponse<TResponse & ApiResponse<TForm>> =
        await myAxios({
          method,
          url,
          data: submissionData,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(submissionData instanceof FormData
              ? { "Content-Type": "multipart/form-data" }
              : {}),
          },
          onUploadProgress: (event: AxiosProgressEvent) => {
            if (event.total) {
              setProgress({
                percentage: Math.round((event.loaded * 100) / event.total),
              });
            }
          },
        });

      const parsedResponse = options.parseResponse
        ? options.parseResponse(response.data)
        : response.data;

      if (parsedResponse?.status === "success") {
        setWasSuccessful(true);
        setRecentlySuccessful(true);
        if (options.onSuccess) options.onSuccess(response.data);
      } else {
        const validationErrors = parsedResponse?.errors || {};
        setErrors(
          Object.entries(validationErrors).reduce<
            Partial<Record<keyof TForm, string>>
          >((acc, [key, value]) => {
            acc[key as keyof TForm] = Array.isArray(value)
              ? value[0]
              : (value as string);
            return acc;
          }, {})
        );
        if (options.onError) {
          options.onError({
            message: parsedResponse?.message || "An error occurred",
            errors: validationErrors,
          });
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorData = {
        message:
          axiosError.response?.data?.message ||
          axiosError.message ||
          "An error occurred",
        errors: axiosError.response?.data?.errors,
      };

      setErrors(
        Object.entries(errorData.errors || {}).reduce<
          Partial<Record<keyof TForm, string>>
        >((acc, [key, value]) => {
          acc[key as keyof TForm] = Array.isArray(value)
            ? value[0]
            : (value as string);
          return acc;
        }, {})
      );
      if (options.onError) options.onError(errorData);
    } finally {
      setProcessing(false);
      if (options.onFinish) options.onFinish();
    }
  };

  return {
    data,
    isDirty,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    processing,
    progress,
    wasSuccessful,
    recentlySuccessful,
    setData: handleSetData,
    transform: (callback) => setData(callback(data)),
    setDefaults: (
      keyOrFields?: keyof TForm | Partial<TForm>,
      value?: FormDataConvertible
    ) => {
      if (typeof keyOrFields === "string" && value !== undefined) {
        setData((prev) => ({ ...prev, [keyOrFields]: value }));
      } else if (typeof keyOrFields === "object") {
        setData((prev) => ({ ...prev, ...keyOrFields }));
      }
    },
    reset: (...fields) => {
      if (fields.length > 0) {
        setData((prev) => {
          const updatedData = { ...prev };
          fields.forEach(
            (field) => (updatedData[field] = initialValues[field])
          );
          return updatedData;
        });
      } else {
        setData(initialValues);
      }
      setIsDirty(false);
    },
    clearErrors: (...fields) => {
      if (fields.length > 0) {
        setErrors((prev) => {
          const updatedErrors = { ...prev };
          fields.forEach((field) => delete updatedErrors[field]);
          return updatedErrors;
        });
      } else {
        setErrors({});
      }
    },
    setError: (
      keyOrErrors: keyof TForm | Record<keyof TForm, string>,
      value?: string
    ) => {
      if (typeof keyOrErrors === "string" && value !== undefined) {
        setErrors((prev) => ({ ...prev, [keyOrErrors]: value }));
      } else if (typeof keyOrErrors === "object") {
        setErrors(keyOrErrors);
      }
    },
    submit: handleSubmit,
    get: (url, options, token) => handleSubmit("GET", url, options, token),
    post: (url, options, token) => handleSubmit("POST", url, options, token),
    put: (url, options, token) => handleSubmit("PUT", url, options, token),
    patch: (url, options, token) => handleSubmit("PATCH", url, options, token),
    delete: (url, options, token) =>
      handleSubmit("DELETE", url, options, token),
    cancel: () => setProcessing(false),
  };
}
