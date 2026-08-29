export interface OperationalAlert {
  id: string;
  label: string;
  count: number;
  tone: "warning" | "error" | "info";
  path: string;
}

export const OPERATIONAL_ALERTS: OperationalAlert[] = [
  { id: "food-requests", label: "Food requests waiting", count: 7, tone: "warning", path: "/nutrition/requests" },
  { id: "coach-pending", label: "Coaches pending approval", count: 3, tone: "warning", path: "/coaches" },
  { id: "transformation-review", label: "Transformations pending review", count: 5, tone: "info", path: "/progress/transformations" },
  { id: "plan-assignment", label: "Plans waiting for assignment", count: 4, tone: "warning", path: "/assignments" },
  { id: "orders-action", label: "Orders requiring action", count: 9, tone: "info", path: "/commerce/orders" },
  { id: "failed-payments", label: "Failed payments", count: 2, tone: "error", path: "/commerce/orders" },
];
