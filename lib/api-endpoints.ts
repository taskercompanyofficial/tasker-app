const BACKEND_URL_ENV = 'https://api.taskercompany.cloud';
if (!BACKEND_URL_ENV) {
  throw new Error("EXPO_PUBLIC_BACKEND_URL is not set");
}
export const BACKEND_URL = BACKEND_URL_ENV;
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
export const WORK_ORDER_URL = `${APP_URL}/my-work-orders`;
export const TRENDING_PARENT_SERVICE_URL = `${APP_URL}/trending-services`;
export const PARENT_SERVICE_URL = `${APP_URL}/parent-services`;
export const NOTIFICATION_URL = `${APP_URL}/notifications`;
export const COMMERCIAL_QUOTE_URL = `${APP_URL}/commercial-quotes`;
export const FREE_INSTALLATION_URL = `${APP_URL}/free-installations`;
export const VENDOR_LOGIN_URL = `${API_URL}/vendor/login`;
export const VENDOR_REGISTER_URL = `${API_URL}/vendor/register`;
export const VENDOR_ME_URL = `${API_URL}/vendor/me`;
export const VENDOR_SIGN_OUT_URL = `${API_URL}/vendor/sign-out`;
export const VENDOR_UPDATE_PROFILE_URL = `${API_URL}/vendor/update-profile`;
export const VENDOR_CHANGE_PASSWORD_URL = `${API_URL}/vendor/change-password`;
export const VENDOR_OTP_URL = `${API_URL}/vendor/auth/check-credentials`;
export const VENDOR_OTP_VERIFY_URL = `${API_URL}/vendor/auth/verify-otp`;
