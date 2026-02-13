import { useEffect, useState } from "react";
import type { ParentService } from "@/types/parent-service";
import { fetchTrendingParentServices } from "@/services/parent-services";

export function useFetchTrendingParentServices(perPage = 10) {
  const [data, setData] = useState<ParentService[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const items = await fetchTrendingParentServices(perPage);
        if (isMounted) setData(items);
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || "Failed to load trending services";
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [perPage]);

  return { data, loading, error };
}
