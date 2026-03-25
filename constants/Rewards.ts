export type RewardPolicy = {
  currency: string;
  dailyCheckInAmounts: number[]; // optional currency cycle
  dailyDiscountPercents: number[]; // 7-day cycle
  bookingCompleteAmount: number;
  maxUnclaimed: number;
  cycleDays: number;
};

export const DefaultRewardPolicy: RewardPolicy = {
  currency: "PKR",
  dailyCheckInAmounts: [10, 15, 20, 25, 30, 40, 50],
  dailyDiscountPercents: [2, 5, 7, 10, 12, 15, 20],
  bookingCompleteAmount: 25,
  maxUnclaimed: 20,
  cycleDays: 7,
};
