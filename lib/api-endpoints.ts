export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://api.taskercompany.cloud";
export const API_URL = `${BACKEND_URL}/api`;
export const APP_URL = `${API_URL}/tasker-app`;

// Auth URLs
export const LOGIN_URL = `${APP_URL}/auth/sign-in`;
export const OTP_VERIFY_URL = `${APP_URL}/auth/verify-otp`;
export const CUSTOMER_CREATE_URL = `${APP_URL}/auth/create-customer`;
export const LOGOUT_URL = `${APP_URL}/auth/sign-out`;
export const OTP_URL = `${APP_URL}/auth/check-credentials`;
export const GET_ME_USER_URL = `${APP_URL}/auth/me`;
export const UPDATE_PROFILE_URL = `${APP_URL}/auth/update-profile`;

// Website URLs
export const GET_CATEGORIES_URL = `${APP_URL}/categories`;
export const GET_SERVICES_URL = `${APP_URL}/services`;
export const GET_AUTHORIZED_BRANDS_URL = `${APP_URL}/authorized-brands`;
export const ADDRESS_URL = `${APP_URL}/address`;
export const ORDER_URL = `${APP_URL}/orders`;
export const PARENT_SERVICE_URL = `${APP_URL}/parent-services`;
export const NOTIFICATION_URL = `${APP_URL}/notifications`;
export const COMMERCIAL_QUOTE_URL = `${APP_URL}/commercial-quotes`;
export const FREE_INSTALLATION_URL = `${APP_URL}/free-installations`;
