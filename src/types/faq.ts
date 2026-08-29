export type FaqCategory = "General" | "Billing" | "Coaching" | "Nutrition" | "Technical" | "Account";
export type FaqStatus = "Published" | "Archived";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  status: FaqStatus;
  order: number;
  updatedAt: string;
}
