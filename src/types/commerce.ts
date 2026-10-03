export type ProductSize = "S/M/L" | "S/M" | "M/L" | "S/L" | "One Size" | "Free Size";
export type ProductStatus = "Active" | "Inactive";

export interface Product {
  id: string;
  name: string;
  description: string;
  points: number;
  size: ProductSize;
  imageUrl: string | null;
  imageFileName: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

