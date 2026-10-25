const BACKEND_URL_ENV =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://api.taskercompany.cloud";
export const BACKEND_URL = BACKEND_URL_ENV;
export const API_URL = `${BACKEND_URL}/api`;
export const APP_URL = `${API_URL}/tasker-app`;
export const APP_VERSION_CHECK_URL = `${APP_URL}/app-version/check`;
export const APP_LOGS_INGEST_URL = `${API_URL}/logs`;

// Auth URLs
export const LOGIN_URL = `${APP_URL}/auth/sign-in`;
export const OTP_VERIFY_URL = `${APP_URL}/auth/verify-otp`;
export const CUSTOMER_CREATE_URL = `${APP_URL}/auth/create-customer`;
export const LOGOUT_URL = `${APP_URL}/auth/sign-out`;
export const OTP_URL = `${APP_URL}/auth/check-credentials`;
export const GET_ME_USER_URL = `${APP_URL}/auth/me`;
export const UPDATE_PROFILE_URL = `${APP_URL}/auth/update-profile`;
export const DELETE_ACCOUNT_URL = `${APP_URL}/auth/delete-account`;

// Website URLs
export const GET_MAIN_CATEGORIES_URL = `${APP_URL}/main-categories`;
export const GET_CATEGORIES_URL = `${APP_URL}/categories`;
export const PROMOTIONS_URL = `${APP_URL}/promotions`;
export const GET_SERVICES_URL = `${APP_URL}/services`;
export const GET_AUTHORIZED_BRANDS_URL = `${APP_URL}/authorized-brands`;
export const ADDRESS_URL = `${APP_URL}/address`;
export const ORDER_URL = `${APP_URL}/work-orders/my-work-orders`;
export const WORK_ORDER_URL = `${APP_URL}/work-orders`;
export const TRENDING_PARENT_SERVICE_URL = `${APP_URL}/trending-services`;
export const PARENT_SERVICE_URL = `${APP_URL}/parent-services`;
export const NOTIFICATION_URL = `${APP_URL}/notifications`;
export const COMMERCIAL_QUOTE_URL = `${APP_URL}/commercial-quotes`;
export const WALLET_URL = `${APP_URL}/wallet`;
export const GIFTS_URL = `${APP_URL}/gifts`;
export const FREE_INSTALLATION_URL = `${APP_URL}/free-installations`;
export const CITIES_URL = `${APP_URL}/cities`;
export const WEBSITE_BRANCHES_URL = `${API_URL}/website/branches`;
export const VENDOR_LOGIN_URL = `${API_URL}/vendor/login`;
export const VENDOR_REGISTER_URL = `${API_URL}/vendor/register`;
export const VENDOR_ME_URL = `${API_URL}/vendor/me`;
export const VENDOR_SIGN_OUT_URL = `${API_URL}/vendor/sign-out`;
export const VENDOR_UPDATE_PROFILE_URL = `${API_URL}/vendor/update-profile`;
export const VENDOR_EXTRACT_CNIC_URL = `${API_URL}/vendor/extract-cnic`;
export const VENDOR_VERIFY_SELFIE_URL = `${API_URL}/vendor/verify-selfie`;
export const VENDOR_CHANGE_PASSWORD_URL = `${API_URL}/vendor/change-password`;

// Vendor & Staff Online Status & 24h Daily Selfie
export const VENDOR_ONLINE_STATUS_URL = (mode: string = "vendor") =>
  `${API_URL}/${mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "vendor"}/status`;
export const VENDOR_TOGGLE_ONLINE_STATUS_URL = (mode: string = "vendor") =>
  `${API_URL}/${mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "vendor"}/status/toggle`;
export const VENDOR_SUBMIT_DAILY_SELFIE_URL = (mode: string = "vendor") =>
  `${API_URL}/${mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "vendor"}/daily-selfie`;

// In-App VoIP Voice Calling Endpoints
export const VOICE_INITIATE_CALL_URL = (mode: string = "customer") =>
  `${API_URL}/${mode === "vendor" ? "vendor" : mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "tasker-app"}/voice/calls/initiate`;
export const VOICE_ANSWER_CALL_URL = (id: number | string, mode: string = "customer") =>
  `${API_URL}/${mode === "vendor" ? "vendor" : mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "tasker-app"}/voice/calls/${id}/answer`;
export const VOICE_REJECT_CALL_URL = (id: number | string, mode: string = "customer") =>
  `${API_URL}/${mode === "vendor" ? "vendor" : mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "tasker-app"}/voice/calls/${id}/reject`;
export const VOICE_END_CALL_URL = (id: number | string, mode: string = "customer") =>
  `${API_URL}/${mode === "vendor" ? "vendor" : mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "tasker-app"}/voice/calls/${id}/end`;
export const VOICE_RINGING_CALL_URL = (id: number | string, mode: string = "customer") =>
  `${API_URL}/${mode === "vendor" ? "vendor" : mode === "vendor_staff" || mode === "vendor-staff" ? "vendor-staff" : "tasker-app"}/voice/calls/${id}/ringing`;

export const VENDOR_OTP_URL = `${API_URL}/vendor/auth/check-credentials`;
export const VENDOR_OTP_VERIFY_URL = `${API_URL}/vendor/auth/verify-otp`;
export const VENDOR_QUICK_LOGIN_URL = `${API_URL}/vendor/auth/quick-login`;
export const VENDOR_QUICK_LOGIN_REGISTER_URL = `${API_URL}/vendor/auth/quick-login/register`;
export const VENDOR_QUICK_LOGIN_REVOKE_URL = `${API_URL}/vendor/auth/quick-login/revoke`;
export const VENDOR_EARNINGS_URL = `${API_URL}/vendor/earnings`;
export const VENDOR_PAYOUT_SUBMIT_URL = `${VENDOR_EARNINGS_URL}/payout`;
export const VENDOR_NOTIFICATIONS_URL = `${API_URL}/vendor/notifications`;
export const VENDOR_NOTIFICATIONS_UNREAD_COUNT_URL = `${VENDOR_NOTIFICATIONS_URL}/unread-count`;
export const VENDOR_NOTIFICATIONS_MARK_READ_URL = (id: number | string) =>
  `${VENDOR_NOTIFICATIONS_URL}/${id}/read`;
export const VENDOR_NOTIFICATIONS_MARK_ALL_READ_URL = `${VENDOR_NOTIFICATIONS_URL}/mark-all-read`;
export const VENDOR_RATES_URL = `${API_URL}/vendor/rates`;
export const VENDOR_STAFF_URL = `${API_URL}/vendor/staff`;
export const VENDOR_STAFF_DETAILS_URL = (id: number) =>
  `${VENDOR_STAFF_URL}/${id}`;
export const VENDOR_STAFF_UPDATE_URL = (id: number) =>
  `${VENDOR_STAFF_URL}/${id}`;
export const VENDOR_STAFF_DELETE_URL = (id: number) =>
  `${VENDOR_STAFF_URL}/${id}`;
export const VENDOR_STAFF_TOGGLE_STATUS_URL = (id: number) =>
  `${VENDOR_STAFF_URL}/${id}/toggle-status`;
export const VENDOR_STAFF_WORK_ORDERS_URL_BY_ID = (id: number) =>
  `${VENDOR_STAFF_URL}/${id}/work-orders`;
export const VENDOR_STAFF_RESET_PASSWORD_URL = (id: number) =>
  `${VENDOR_STAFF_URL}/${id}/reset-password`;
// Service Concerns endpoints
export const SERVICE_CONCERNS_URL = `${APP_URL}/service-concerns-raw`;
export const SERVICE_SUB_CONCERNS_URL = (concernId: number) =>
  `${APP_URL}/service-sub-concerns-raw?service_concern_id=${concernId}`;
export const WARRANTY_TYPES_URL = `${APP_URL}/warranty-types-raw`;

// Vendor Work Orders
export const VENDOR_WORK_ORDER_SUMMARY_URL = `${API_URL}/vendor/work-orders/summary`;
export const VENDOR_WORK_ORDER_URL = `${API_URL}/vendor/work-orders`;
export const VENDOR_WORK_ORDER_DETAILS_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}`;
export const VENDOR_ACCEPT_WORK_ORDER_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/accept`;
export const VENDOR_REJECT_WORK_ORDER_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/reject`;
export const VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/update-status-by-slug`;
export const VENDOR_SCHEDULE_WORK_ORDER_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/schedule`;
export const VENDOR_CANCEL_WORK_ORDER_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/cancel`;
export const VENDOR_ASSIGN_STAFF_URL = (id: number | string) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/assign-staff`;
export const VENDOR_UPDATE_WORK_ORDER_DETAILS_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/update-details`;
export const VENDOR_FILE_TYPES_URL = `${VENDOR_WORK_ORDER_URL}/file-types`;
export const VENDOR_UPLOAD_WORK_ORDER_FILE_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/upload-file`;
export const VENDOR_DELETE_WORK_ORDER_FILE_URL = (id: number, fileId: number) =>
  `${VENDOR_WORK_ORDER_URL}/${id}/files/${fileId}`;
export const VENDOR_SERVICE_CONCERNS_URL = `${VENDOR_WORK_ORDER_URL}/service-concerns`;
export const VENDOR_SERVICE_SUB_CONCERNS_URL = (id: number) =>
  `${VENDOR_WORK_ORDER_URL}/service-concerns/${id}/sub-concerns`;
export const VENDOR_WARRANTY_TYPES_URL = `${VENDOR_WORK_ORDER_URL}/warranty-types`;

// Vendor Staff Auth
export const VENDOR_STAFF_LOGIN_URL = `${API_URL}/vendor-staff/login`;
export const VENDOR_STAFF_ME_URL = `${API_URL}/vendor-staff/me`;
export const VENDOR_STAFF_SIGN_OUT_URL = `${API_URL}/vendor-staff/sign-out`;
export const VENDOR_STAFF_CHANGE_PASSWORD_URL = `${API_URL}/vendor-staff/change-password`;
export const VENDOR_STAFF_WORK_ORDERS_URL = `${API_URL}/vendor-staff/work-orders`;
export const VENDOR_STAFF_WORK_ORDER_SUMMARY_URL = `${API_URL}/vendor-staff/work-orders/summary`;
export const VENDOR_STAFF_WORK_ORDER_DETAILS_URL = (id: number) =>
  `${API_URL}/vendor-staff/work-orders/${id}`;
export const VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL = (id: number) =>
  `${API_URL}/vendor-staff/work-orders/${id}/update-status-by-slug`;
export const VENDOR_STAFF_OTP_URL = `${API_URL}/vendor-staff/auth/check-credentials`;
export const VENDOR_STAFF_OTP_VERIFY_URL = `${API_URL}/vendor-staff/auth/verify-otp`;
export const VENDOR_STAFF_QUICK_LOGIN_URL = `${API_URL}/vendor-staff/auth/quick-login`;
export const VENDOR_STAFF_QUICK_LOGIN_REGISTER_URL = `${API_URL}/vendor-staff/auth/quick-login/register`;
export const VENDOR_STAFF_QUICK_LOGIN_REVOKE_URL = `${API_URL}/vendor-staff/auth/quick-login/revoke`;

// Location Tracking
export const VENDOR_LOCATION_PING_URL = `${API_URL}/vendor/location/ping`;
export const VENDOR_STAFF_LOCATION_PING_URL = `${API_URL}/vendor-staff/location/ping`;

// App Chat Endpoints
export const CHAT_INITIATE_SUPPORT_URL = (
  mode: "customer" | "vendor" | "vendor-staff",
) => {
  const prefix =
    mode === "vendor"
      ? "vendor"
      : mode === "vendor-staff"
        ? "vendor-staff"
        : "tasker-app";
  return `${API_URL}/${prefix}/chat/initiate-support-chat`;
};

export const CHAT_INITIATE_ORDER_URL = (
  mode: "customer" | "vendor" | "vendor-staff",
  workOrderId: number | string,
) => {
  const prefix =
    mode === "vendor"
      ? "vendor"
      : mode === "vendor-staff"
        ? "vendor-staff"
        : "tasker-app";
  return `${API_URL}/${prefix}/chat/initiate-order-chat/${workOrderId}`;
};

export const CHAT_MESSAGES_URL = (
  mode: "customer" | "vendor" | "vendor-staff",
  conversationId: number | string,
) => {
  const prefix =
    mode === "vendor"
      ? "vendor"
      : mode === "vendor-staff"
        ? "vendor-staff"
        : "tasker-app";
  return `${API_URL}/${prefix}/chat/conversations/${conversationId}/messages`;
};

export const CHAT_CONVERSATIONS_URL = (
  mode: "customer" | "vendor" | "vendor-staff",
) => {
  const prefix =
    mode === "vendor"
      ? "vendor"
      : mode === "vendor-staff"
        ? "vendor-staff"
        : "tasker-app";
  return `${API_URL}/${prefix}/chat/conversations`;
};

export const CHAT_SEND_MESSAGE_URL = (
  mode: "customer" | "vendor" | "vendor-staff",
  conversationId: number | string,
) => {
  const prefix =
    mode === "vendor"
      ? "vendor"
      : mode === "vendor-staff"
        ? "vendor-staff"
        : "tasker-app";
  return `${API_URL}/${prefix}/chat/conversations/${conversationId}/send`;
};

