import { useCallback, useEffect, useState } from "react";
import { listCoaches } from "../../../api/coaches";
import { listCoupons } from "../../../api/coupons";
import { listGogetfitPlans } from "../../../api/gogetfitPlans";
import type { CoachRecord } from "../../../types/coach";
import type { Coupon } from "../../../types/coupons";
import type { GogetfitPlanRow } from "../../../types/gogetfitPlans";

/**
 * What the Add Client form chooses from: active plans, active coaches and
 * coupons that are active today (public and private - an admin may apply either).
 * The server re-checks every one of them when the enrollment is created.
 */
export function useReferenceData() {
  const [plans, setPlans] = useState<GogetfitPlanRow[]>([]);
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([
      listGogetfitPlans({ status: "active", pageSize: 100, sortKey: "name", sortDir: "asc" }),
      listCoaches({ status: "active", pageSize: 100 }),
      listCoupons({ status: "active", pageSize: 100 }),
    ])
      .then(([p, c, cp]) => {
        if (cancelled) return;
        setPlans(p.rows);
        setCoaches(c.rows);
        setCoupons(cp.rows);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { plans, coaches, coupons, loading, error, retry };
}
