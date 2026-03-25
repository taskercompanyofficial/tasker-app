import AsyncStorage from "@react-native-async-storage/async-storage";
import myAxios from "@/lib/axios.config";
import { WALLET_URL } from "@/lib/api-endpoints";

export type WalletTransaction = {
  id: string;
  type: "recharge" | "debit" | "refund" | "gift";
  title: string;
  date: string;
  amount: number;
  status: "success" | "pending" | "failed";
  method?: "card" | "wallet" | "bank";
};

const BALANCE_KEY = "wallet_balance";
const TXN_KEY = "wallet_txns";

export async function getBalance(): Promise<number> {
  try {
    const res = await myAxios.get(`${WALLET_URL}`);
    const balance = Number(res.data?.balance ?? 0);
    await AsyncStorage.setItem(BALANCE_KEY, String(balance));
    return balance;
  } catch {
    const raw = await AsyncStorage.getItem(BALANCE_KEY);
    return raw ? Number(raw) : 0;
  }
}

export async function getTransactions(): Promise<WalletTransaction[]> {
  try {
    const res = await myAxios.get(`${WALLET_URL}/transactions`);
    const items = Array.isArray(res.data?.data) ? res.data.data : [];
    const mapped: WalletTransaction[] = items.map((i: any) => {
      const amt = Number(i.amount ?? 0);
      return {
        id: String(i.id),
        type: i.type,
        title: i.title,
        date: i.created_at ?? "",
        amount: i.type === "debit" ? -Math.abs(amt) : Math.abs(amt),
        status: i.status ?? "success",
        method: i.method ?? "wallet",
      } as WalletTransaction;
    });
    await AsyncStorage.setItem(TXN_KEY, JSON.stringify(mapped));
    return mapped;
  } catch {
    const raw = await AsyncStorage.getItem(TXN_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as WalletTransaction[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

async function setBalance(amount: number) {
  await AsyncStorage.setItem(BALANCE_KEY, String(amount));
}

async function setTransactions(txns: WalletTransaction[]) {
  await AsyncStorage.setItem(TXN_KEY, JSON.stringify(txns));
}

function now() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export async function recharge(amount: number, method: "card" | "bank" = "card") {
  const res = await myAxios.post(`${WALLET_URL}/recharge`, { amount, method });
  const balance = Number(res.data?.balance ?? 0);
  await setBalance(balance);
  const txns = await getTransactions();
  return { balance, transactions: txns };
}

export async function refund(amount: number) {
  const res = await myAxios.post(`${WALLET_URL}/refund`, { amount, title: "Refund" });
  const balance = Number(res.data?.balance ?? 0);
  await setBalance(balance);
  const txns = await getTransactions();
  return { balance, transactions: txns };
}

export async function debit(amount: number, title = "Service Payment") {
  const res = await myAxios.post(`${WALLET_URL}/debit`, { amount, title });
  const balance = Number(res.data?.balance ?? 0);
  await setBalance(balance);
  const txns = await getTransactions();
  return { balance, transactions: txns };
}

export async function creditFromGift(amount: number, title = "Gift Credit") {
  const res = await myAxios.post(`${WALLET_URL}/refund`, { amount, title });
  const balance = Number(res.data?.balance ?? 0);
  await setBalance(balance);
  const txns = await getTransactions();
  return { balance, transactions: txns };
}

export async function seedDemoData() {
  const txns = await getTransactions();
  if (txns.length === 0) {
    await setBalance(1250);
    await setTransactions([
      {
        id: "seed_r1",
        type: "recharge",
        title: "Wallet Top-up",
        date: now(),
        amount: 1000,
        status: "success",
        method: "card",
      },
      {
        id: "seed_d1",
        type: "debit",
        title: "Service Payment",
        date: now(),
        amount: -750,
        status: "success",
        method: "wallet",
      },
      {
        id: "seed_f1",
        type: "refund",
        title: "Cancellation Refund",
        date: now(),
        amount: 500,
        status: "pending",
        method: "wallet",
      },
    ]);
  }
}

export function formatPKR(value: number) {
  try {
    return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 2 }).format(value);
  } catch {
    const n = Number.isFinite(value) ? value : 0;
    return `PKR ${n.toFixed(2)}`;
  }
}
