import { useEffect, useState, useRef } from "react";
import { createEcho } from "@/lib/echo";
import { useAuthStore } from "@/context/auth-store";

interface VendorCoords {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt?: string;
}

/**
 * useVendorLiveLocation
 *
 * Subscribes to the private `work-order.{orderId}` Reverb channel and
 * listens for `.vendor.location` events emitted by the Laravel backend
 * whenever the assigned vendor/vendor-staff POSTs a location ping.
 *
 * Returns the latest vendor GPS coords, or null if the channel is not
 * active / the vendor hasn't pinged yet.
 *
 * Usage:
 *   const vendorCoords = useVendorLiveLocation(order.id);
 *
 * Pass `null` as orderId to skip subscribing (e.g. when order is not
 * in_progress or no vendor is assigned).
 */
export function useVendorLiveLocation(
  orderId: number | string | null | undefined
): VendorCoords | null {
  const token = useAuthStore((s) => s.token);
  const [coords, setCoords] = useState<VendorCoords | null>(null);
  const echoRef = useRef<any>(null);

  useEffect(() => {
    if (!orderId || !token) return;

    // Create a dedicated Echo instance for this subscription
    const echo = createEcho(token);
    echoRef.current = echo;

    echo
      .private(`work-order.${orderId}`)
      .listen(".vendor.location", (data: any) => {
        setCoords({
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading ?? null,
          speed: data.speed ?? null,
          updatedAt: data.updated_at,
        });
      });

    return () => {
      try {
        echo.leave(`work-order.${orderId}`);
        echo.disconnect();
      } catch (_) {}
      echoRef.current = null;
    };
  }, [orderId, token]);

  return coords;
}
