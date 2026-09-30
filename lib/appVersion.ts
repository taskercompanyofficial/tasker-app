import * as Application from "expo-application";
import Constants from "expo-constants";

/**
 * Returns the release version of the app (e.g. "1.0.1").
 * Priority: Native application version -> expoConfig version -> fallback.
 */
export function getAppVersion(): string {
  return (
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.0"
  );
}

/**
 * Returns the build number of the app (e.g. "6").
 * On iOS, this is CFBundleVersion (incremented by EAS).
 * On Android, this is versionCode.
 */
export function getAppBuildNumber(): string | null {
  return (
    Application.nativeBuildVersion ||
    Constants.expoConfig?.ios?.buildNumber ||
    (Constants.expoConfig?.android?.versionCode
      ? String(Constants.expoConfig.android.versionCode)
      : null)
  );
}

/**
 * Formats a clean, user-friendly version string:
 * e.g. "Tasker Company v1.0.1 (6)" or "v1.0.1 (6)"
 */
export function getAppVersionDisplay(appName?: string): string {
  const version = getAppVersion();
  const build = getAppBuildNumber();
  const prefix = appName ? `${appName} ` : "";
  const buildSuffix = build ? ` (${build})` : "";
  return `${prefix}v${version}${buildSuffix}`;
}
