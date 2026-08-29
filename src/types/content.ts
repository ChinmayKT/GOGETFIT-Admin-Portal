export type ArticleStatus = "Draft" | "Published" | "Scheduled";

export interface ArticleMedia {
  id: string;
  url: string;
  fileName: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown source, rendered via ArticleRichTextEditor's renderMarkdown()
  author: string;
  status: ArticleStatus;
  scheduledAt: string | null;
  media: ArticleMedia[];
  updatedAt: string;
  createdAt: string;
}

export type BannerStatus = "Active" | "Inactive";

export type BannerRedirectTarget =
  | "Home"
  | "Diet Plans"
  | "Challenges"
  | "Store"
  | "Coach Profile"
  | "External URL";

export interface Banner {
  id: string;
  name: string;
  description: string;
  redirectTarget: BannerRedirectTarget;
  redirectUrl: string | null; // populated only when redirectTarget === "External URL"
  fromDate: string;
  toDate: string;
  status: BannerStatus;
  imageUrl: string | null;
  imageFileName: string | null;
  updatedAt: string;
  createdAt: string;
}

export type MediaCategory = "Images" | "Videos" | "Documents";

export type MediaModule =
  | "Articles"
  | "Banners"
  | "Coaches"
  | "Workouts"
  | "Food"
  | "Challenges"
  | "Transformations"
  | "Products";

export interface MediaAsset {
  id: string;
  fileName: string;
  category: MediaCategory;
  module: MediaModule;
  url: string | null;
  sizeLabel: string;
  dimensions: string | null;
  durationLabel: string | null;
  usageCount: number;
  uploadedBy: string;
  uploadedAt: string;
}
