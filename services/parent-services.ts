import myAxios from "@/lib/axios.config";
import { TRENDING_PARENT_SERVICE_URL } from "@/lib/api-endpoints";
import type { ParentService } from "@/types/parent-service";

export async function fetchTrendingParentServices(perPage = 10): Promise<ParentService[]> {
  const url = `${TRENDING_PARENT_SERVICE_URL}?limit=${perPage}`;
  const res = await myAxios.get(url);
  const arr = res?.data?.data;
  if (Array.isArray(arr)) {
    return arr.map((item: any) => ({
      ...item,
      price: Number(item?.price ?? 0),
      discount: Number(item?.discount ?? 0),
    })) as ParentService[];
  }
  return [];
}
