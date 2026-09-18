import * as Linking from "expo-linking";
import { useEffect } from "react";

/**
 * Parse coordinates from incoming geo: URIs or Google Maps URLs
 */
export function parseGeoLocationUrl(url: string): { latitude: number; longitude: number } | null {
  if (!url) return null;

  try {
    // 1. Handle geo:lat,lng format
    if (url.startsWith("geo:")) {
      const coordsPart = url.replace(/^geo:/, "").split("?")[0];
      const queryPart = url.includes("?q=") ? url.split("?q=")[1] : "";

      if (coordsPart && coordsPart.includes(",")) {
        const [latStr, lngStr] = coordsPart.split(",");
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          return { latitude: lat, longitude: lng };
        }
      }

      if (queryPart) {
        const cleanQuery = decodeURIComponent(queryPart).split("(")[0];
        if (cleanQuery.includes(",")) {
          const [latStr, lngStr] = cleanQuery.split(",");
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { latitude: lat, longitude: lng };
          }
        }
      }
    }

    // 2. Handle Google Maps URLs (https://maps.google.com/?q=lat,lng or https://www.google.com/maps/search/?api=1&query=lat,lng)
    if (url.includes("google.com/maps") || url.includes("maps.google") || url.includes("maps.app.goo.gl")) {
      const match = url.match(/q(?:uery)?=([0-9.-]+),([0-9.-]+)/) || url.match(/@([0-9.-]+),([0-9.-]+)/);
      if (match && match[1] && match[2]) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { latitude: lat, longitude: lng };
        }
      }
    }
  } catch (err) {
    console.warn("[GeoLinkHandler] Error parsing geo URL:", err);
  }

  return null;
}

/**
 * Hook to handle incoming Geo Location intent links (from WhatsApp, Google Maps, Chrome, etc.)
 */
export function useGeoLinkHandler(onGeoLocationReceived?: (coords: { latitude: number; longitude: number }) => void) {
  useEffect(() => {
    async function checkInitialUrl() {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const coords = parseGeoLocationUrl(initialUrl);
          if (coords && onGeoLocationReceived) {
            onGeoLocationReceived(coords);
          }
        }
      } catch (err) {
        console.warn("[GeoLinkHandler] Initial URL check error:", err);
      }
    }

    checkInitialUrl();

    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url) {
        const coords = parseGeoLocationUrl(event.url);
        if (coords && onGeoLocationReceived) {
          onGeoLocationReceived(coords);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onGeoLocationReceived]);
}
