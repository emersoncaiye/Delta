// Return value calculation based on hold time
// 持有时间与回流比例对照表

export interface HoldTier {
  label: string;
  minDays: number;
  maxDays: number | null;
  rate: number; // 统一回流比例
}

export const HOLD_TIERS: HoldTier[] = [
  { label: "1月内", minDays: 0, maxDays: 30, rate: 0.9 },
  { label: "3月内", minDays: 31, maxDays: 90, rate: 0.7 },
  { label: "6月内", minDays: 91, maxDays: 180, rate: 0.5 },
  { label: "12月内", minDays: 181, maxDays: 365, rate: 0.3 },
  { label: "1年以上", minDays: 366, maxDays: null, rate: 0 }, // 代售模式，用户70%
];

export function getHoldTier(days: number): HoldTier | null {
  return HOLD_TIERS.find((tier) => {
    if (tier.maxDays === null) return days >= tier.minDays;
    return days >= tier.minDays && days <= tier.maxDays;
  }) || null;
}

export function calculateReturnValue(
  originalPrice: number,
  holdDays: number,
  mode: "exchange" | "cash" = "exchange"
): {
  holdDays: number;
  holdTier: string;
  rate: number;
  amount: number;
  mode: string;
  isCharity: boolean;
  charityRate: number;
  detail: string;
} {
  const tier = getHoldTier(holdDays);
  if (!tier) {
    throw new Error("Invalid hold days");
  }

  // 1年以上是代售模式，用户获得70%
  const isResaleMode = holdDays > 365;
  const rate = isResaleMode ? 0.7 : tier.rate;
  const amount = Math.round(originalPrice * rate);
  const isCharity = !isResaleMode;

  return {
    holdDays,
    holdTier: tier.label,
    rate,
    amount,
    mode,
    isCharity,
    charityRate: isCharity ? 0.1 : 0,
    detail: isResaleMode
      ? `持有${holdDays}天（${tier.label}），代售模式，用户获得 70%，回流金额 ¥${amount.toLocaleString()}`
      : `持有${holdDays}天（${tier.label}），回流比例 ${(rate * 100).toFixed(0)}%，回流金额 ¥${amount.toLocaleString()}`,
  };
}
