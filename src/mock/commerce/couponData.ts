import type { Coupon } from "../../types/commerce";
import { randomInt, daysAgo, daysFromNow } from "../shared/utils";

interface CouponSeed {
  name: string;
  code: string;
  discountPercent: number;
  everyone: boolean;
}

const COUPON_SEEDS: CouponSeed[] = [
  { name: "New Year Fitness Kickoff", code: "NEWYEAR25", discountPercent: 25, everyone: true },
  { name: "Republic Day Special", code: "REPUBLIC26", discountPercent: 15, everyone: true },
  { name: "Summer Shred Sale", code: "SUMMER20", discountPercent: 20, everyone: true },
  { name: "First Transformation Bonus", code: "FIRSTTRANSFORM", discountPercent: 30, everyone: false },
  { name: "Referral Reward", code: "REFERFRIEND", discountPercent: 10, everyone: false },
  { name: "Independence Day Offer", code: "FREEDOM15", discountPercent: 15, everyone: true },
  { name: "Diwali Dhamaka", code: "DIWALI30", discountPercent: 30, everyone: true },
  { name: "Coach Appreciation Discount", code: "COACHLOVE", discountPercent: 12, everyone: false },
  { name: "Winning Streak Reward", code: "STREAK7", discountPercent: 18, everyone: false },
  { name: "Monsoon Membership Offer", code: "MONSOON10", discountPercent: 10, everyone: true },
  { name: "Loyal Member Appreciation", code: "LOYAL5YR", discountPercent: 35, everyone: false },
  { name: "Weekend Flash Sale", code: "FLASH50", discountPercent: 50, everyone: true },
  { name: "Corporate Wellness Partner", code: "CORPFIT20", discountPercent: 20, everyone: false },
  { name: "Challenge Winner Bonus", code: "CHAMPION", discountPercent: 25, everyone: false },
  { name: "Festive Season Combo", code: "FESTIVE22", discountPercent: 22, everyone: true },
];

function makeCoupon(seed: CouponSeed, index: number): Coupon {
  const validFrom = daysAgo(randomInt(5, 120));
  const validTo = daysFromNow(randomInt(10, 180));
  const audience = seed.everyone ? "Everyone" : "Specific Users";
  const userIds = seed.everyone
    ? []
    : Array.from({ length: randomInt(2, 5) }, () => `GGF-${randomInt(10000, 99999)}`);
  return {
    id: `coupon_${index + 1}`,
    name: seed.name,
    code: seed.code,
    discountPercent: seed.discountPercent,
    validFrom,
    validTo,
    audience,
    everyone: seed.everyone,
    userIds,
    createdAt: validFrom,
    updatedAt: validFrom,
  };
}

export const MOCK_COUPONS: Coupon[] = COUPON_SEEDS.map((seed, i) => makeCoupon(seed, i));
