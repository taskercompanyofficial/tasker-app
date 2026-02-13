import { useEffect, useState } from "react";
import myAxios from "@/lib/axios.config";
import { PARENT_SERVICE_URL } from "@/lib/api-endpoints";
import type { ParentService } from "@/types/parent-service";
import { Alert } from "react-native";

export function useFetchParentService(slug: string | undefined) {
  const [data, setData] = useState<ParentService | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await myAxios.get(`${PARENT_SERVICE_URL}/${encodeURIComponent(slug)}`);
        const parentService = res?.data?.data as ParentService | undefined;
        if (isMounted) {
          setData(parentService || null);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || "Failed to load";
        if (isMounted) {
          setError(message);
        }
        Alert.alert("Error", message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetch();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { data, loading, error };
}
