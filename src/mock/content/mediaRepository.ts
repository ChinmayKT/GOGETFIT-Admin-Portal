import type { MediaAsset, MediaCategory, MediaModule } from "../../types/content";
import { MOCK_MEDIA_ASSETS } from "./mediaData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";
import { svgVideoPlaceholder, randomSizeLabel } from "./placeholder";

let store: MediaAsset[] = [...MOCK_MEDIA_ASSETS];

export interface MediaListParams {
  query?: string;
  category?: MediaCategory | "";
  module?: MediaModule | string;
  fileType?: string;
  uploadedBy?: string;
  uploadedAfter?: string; // yyyy-mm-dd
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

function extensionOf(fileName: string): string {
  return (fileName.split(".").pop() ?? "").toUpperCase();
}

export async function listMediaAssets(params: MediaListParams = {}) {
  const {
    query = "", category, module, fileType, uploadedBy, uploadedAfter,
    page = 1, pageSize = 12, sortKey = "uploadedAt", sortDir = "desc",
  } = params;

  let rows = store.filter((a) => matchesQuery([a.fileName, a.module, a.uploadedBy], query));
  if (category) rows = rows.filter((a) => a.category === category);
  if (module) rows = rows.filter((a) => a.module === module);
  if (fileType) rows = rows.filter((a) => extensionOf(a.fileName) === fileType);
  if (uploadedBy) rows = rows.filter((a) => a.uploadedBy === uploadedBy);
  if (uploadedAfter) rows = rows.filter((a) => a.uploadedAt.slice(0, 10) >= uploadedAfter);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export function mediaUploaders(): string[] {
  return Array.from(new Set(store.map((a) => a.uploadedBy))).sort();
}

export function mediaFileTypes(): string[] {
  return Array.from(new Set(store.map((a) => extensionOf(a.fileName)))).sort();
}

function categoryForMime(mime: string): MediaCategory {
  if (mime.startsWith("image/")) return "Images";
  if (mime.startsWith("video/")) return "Videos";
  return "Documents";
}

export async function uploadMediaAssets(files: File[], module: MediaModule, uploadedBy: string) {
  const created: MediaAsset[] = files.map((file, i) => {
    const category = categoryForMime(file.type);
    const seed = store.length + i + 1;
    return {
      id: nextId("asset"),
      fileName: file.name,
      category,
      module,
      url: category === "Images" ? URL.createObjectURL(file) : category === "Videos" ? svgVideoPlaceholder(seed, file.name) : null,
      sizeLabel: file.size ? (file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`) : randomSizeLabel(),
      dimensions: category === "Images" ? "1200x628" : null,
      durationLabel: category === "Videos" ? "0:30" : null,
      usageCount: 0,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    };
  });
  store = [...created, ...store];
  return delay(created, 500);
}
