export type OrderStatus = "Booked" | "Sent" | "Delivered";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  address: string;
  itemName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}
