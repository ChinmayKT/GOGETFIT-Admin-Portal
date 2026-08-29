import type { Order, OrderStatus } from "../../types/order";
import { MOCK_USERS } from "../users/data";
import { PLAN_NAMES } from "../shared/reference";
import { randomInt, daysAgo } from "../shared/utils";

const ITEMS = ["Shaker Bottle", "GGF Gym Tee", "Resistance Band Set", "Protein Scoop", "Gym Bag", "Wrist Wraps", ...PLAN_NAMES.slice(0, 3)];
const STATUSES: OrderStatus[] = ["Booked", "Sent", "Delivered", "Delivered", "Delivered"];

function makeOrder(index: number): Order {
  const user = MOCK_USERS[index % MOCK_USERS.length];
  return {
    id: `order_${index}`,
    orderNumber: `#${10000 + index}`,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    address: `${user.address}, ${user.city}, ${user.state} ${user.zipCode}`,
    itemName: ITEMS[index % ITEMS.length],
    amount: randomInt(499, 4999),
    status: STATUSES[index % STATUSES.length],
    createdAt: daysAgo(randomInt(0, 60)),
  };
}

export const MOCK_ORDERS: Order[] = Array.from({ length: 60 }, (_, i) => makeOrder(i + 1));
