import AsyncStorage from "@react-native-async-storage/async-storage";
import myAxios from "@/lib/axios.config";
import { GIFTS_URL } from "@/lib/api-endpoints";

export type GiftType = "daily_checkin" | "booking_complete" | "promo";

export type Gift = {
  id: string;
  title: string;
  amount: number;
  type: GiftType;
  createdAt: string;
  claimedAt?: string | null;
  discountPercent?: number;
};

const GIFTS_CACHE_KEY = "gifts_unclaimed_cache";
const STREAK_CACHE_KEY = "gifts_streak_cache";

export async function getUnclaimed(): Promise<Gift[]> {
  try {
    const res = await myAxios.get(`${GIFTS_URL}/unclaimed`);
    const items = Array.isArray(res.data?.unclaimed) ? res.data.unclaimed : [];
    const mapped: Gift[] = items.map((i: any) => ({
      id: String(i.id),
      title: i.title,
      amount: Number(i.amount ?? 0),
      type: i.type,
      createdAt: i.created_at,
      claimedAt: i.claimed_at ?? null,
      discountPercent: i.discount_percent ?? undefined,
    }));
    await AsyncStorage.setItem(GIFTS_CACHE_KEY, JSON.stringify(mapped));
    await AsyncStorage.setItem(STREAK_CACHE_KEY, String(res.data?.streak ?? 0));
    return mapped;
  } catch {
    const raw = await AsyncStorage.getItem(GIFTS_CACHE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Gift[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

async function cacheUnclaimed(gifts: Gift[]) {
  await AsyncStorage.setItem(GIFTS_CACHE_KEY, JSON.stringify(gifts));
}

export async function ensureTodayDailyGift(): Promise<{ created: boolean; gift?: Gift; streak: number }> {
  const res = await myAxios.post(`${GIFTS_URL}/check-in`);
  const created = Boolean(res.data?.created);
  const streak = Number(res.data?.streak ?? 0);
  const giftData = res.data?.gift;
  if (Array.isArray(res.data?.unclaimed)) {
    const mapped: Gift[] = res.data.unclaimed.map((i: any) => ({
      id: String(i.id),
      title: i.title,
      amount: Number(i.amount ?? 0),
      type: i.type,
      createdAt: i.created_at,
      claimedAt: i.claimed_at ?? null,
      discountPercent: i.discount_percent ?? undefined,
    }));
    await cacheUnclaimed(mapped);
  }
  const gift: Gift | undefined = giftData
    ? {
        id: String(giftData.id),
        title: giftData.title,
        amount: Number(giftData.amount ?? 0),
        type: giftData.type,
        createdAt: giftData.created_at,
        claimedAt: giftData.claimed_at ?? null,
        discountPercent: giftData.discount_percent ?? undefined,
      }
    : undefined;
  await AsyncStorage.setItem(STREAK_CACHE_KEY, String(streak));
  return { created, gift, streak };
}

export async function awardBookingComplete() {
  return null;
}

export async function claimGift(giftId: string) {
  const res = await myAxios.post(`${GIFTS_URL}/claim/${giftId}`);
  const giftData = res.data?.gift;
  const gift: Gift = {
    id: String(giftData.id),
    title: giftData.title,
    amount: Number(giftData.amount ?? 0),
    type: giftData.type,
    createdAt: giftData.created_at,
    claimedAt: giftData.claimed_at ?? null,
    discountPercent: giftData.discount_percent ?? undefined,
  };
  const fresh = await getUnclaimed();
  await cacheUnclaimed(fresh);
  return gift;
}

export async function getStreak(): Promise<number> {
  try {
    const res = await myAxios.get(`${GIFTS_URL}/unclaimed`);
    const s = Number(res.data?.streak ?? 0);
    await AsyncStorage.setItem(STREAK_CACHE_KEY, String(s));
    return s;
  } catch {
    const raw = await AsyncStorage.getItem(STREAK_CACHE_KEY);
    return raw ? Number(raw) : 0;
  }
}
