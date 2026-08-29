import type { MediaAsset, MediaCategory, MediaModule } from "../../types/content";
import { MOCK_USERS } from "../users/data";
import { randomInt, daysAgo } from "../shared/utils";
import { svgImagePlaceholder, svgVideoPlaceholder, randomSizeLabel } from "./placeholder";

interface AssetSeed {
  fileName: string;
  category: MediaCategory;
  module: MediaModule;
}

const SEEDS: AssetSeed[] = [
  { fileName: "banner-summer-sale.jpg", category: "Images", module: "Banners" },
  { fileName: "banner-new-year-challenge.jpg", category: "Images", module: "Banners" },
  { fileName: "banner-coach-launch.png", category: "Images", module: "Banners" },
  { fileName: "banner-store-clearance.jpg", category: "Images", module: "Banners" },
  { fileName: "banner-referral-program.png", category: "Images", module: "Banners" },
  { fileName: "coach-karthik-profile.jpg", category: "Images", module: "Coaches" },
  { fileName: "coach-priya-profile.jpg", category: "Images", module: "Coaches" },
  { fileName: "coach-ananya-profile.jpg", category: "Images", module: "Coaches" },
  { fileName: "coach-rohan-certificate.pdf", category: "Documents", module: "Coaches" },
  { fileName: "coach-vikram-certificate.pdf", category: "Documents", module: "Coaches" },
  { fileName: "workout-squat-demo.mp4", category: "Videos", module: "Workouts" },
  { fileName: "workout-deadlift-form.mp4", category: "Videos", module: "Workouts" },
  { fileName: "workout-hiit-circuit.mp4", category: "Videos", module: "Workouts" },
  { fileName: "workout-plank-guide.jpg", category: "Images", module: "Workouts" },
  { fileName: "workout-mobility-routine.jpg", category: "Images", module: "Workouts" },
  { fileName: "food-grilled-chicken-bowl.jpg", category: "Images", module: "Food" },
  { fileName: "food-paneer-tikka.jpg", category: "Images", module: "Food" },
  { fileName: "food-nutrition-label.png", category: "Images", module: "Food" },
  { fileName: "food-macro-chart.png", category: "Images", module: "Food" },
  { fileName: "food-diet-plan-template.pdf", category: "Documents", module: "Food" },
  { fileName: "challenge-30day-banner.jpg", category: "Images", module: "Challenges" },
  { fileName: "challenge-leaderboard-banner.jpg", category: "Images", module: "Challenges" },
  { fileName: "challenge-rules.pdf", category: "Documents", module: "Challenges" },
  { fileName: "challenge-intro-video.mp4", category: "Videos", module: "Challenges" },
  { fileName: "transformation-before-after-1.jpg", category: "Images", module: "Transformations" },
  { fileName: "transformation-before-after-2.jpg", category: "Images", module: "Transformations" },
  { fileName: "transformation-video-testimonial.mp4", category: "Videos", module: "Transformations" },
  { fileName: "product-whey-protein.jpg", category: "Images", module: "Products" },
  { fileName: "product-resistance-bands.jpg", category: "Images", module: "Products" },
  { fileName: "product-yoga-mat.jpg", category: "Images", module: "Products" },
  { fileName: "product-catalog.pdf", category: "Documents", module: "Products" },
  { fileName: "article-warmup-cover.jpg", category: "Images", module: "Articles" },
  { fileName: "article-progressive-overload-cover.jpg", category: "Images", module: "Articles" },
  { fileName: "article-recovery-tips-cover.jpg", category: "Images", module: "Articles" },
  { fileName: "article-nutrition-guide.pdf", category: "Documents", module: "Articles" },
];

const DIMENSIONS = ["1200x628", "1080x1080", "800x800", "1600x900", "640x480"];
const DURATIONS = ["0:32", "0:45", "1:05", "1:20", "2:10", "2:45"];

function makeAsset(seed: AssetSeed, index: number): MediaAsset {
  const user = MOCK_USERS[index % MOCK_USERS.length];
  const uploadedBy = index % 6 === 0 ? "Chinmay" : `${user.firstName} ${user.lastName}`;

  const base = {
    id: `asset_${index}`,
    fileName: seed.fileName,
    category: seed.category,
    module: seed.module,
    usageCount: randomInt(0, 12),
    uploadedBy,
    uploadedAt: daysAgo(randomInt(1, 240)),
  };

  if (seed.category === "Images") {
    return {
      ...base,
      url: svgImagePlaceholder(index, seed.fileName),
      sizeLabel: randomSizeLabel(80, 3200),
      dimensions: DIMENSIONS[index % DIMENSIONS.length],
      durationLabel: null,
    };
  }
  if (seed.category === "Videos") {
    return {
      ...base,
      url: svgVideoPlaceholder(index, seed.fileName),
      sizeLabel: randomSizeLabel(2000, 42000),
      dimensions: null,
      durationLabel: DURATIONS[index % DURATIONS.length],
    };
  }
  return {
    ...base,
    url: null,
    sizeLabel: randomSizeLabel(120, 2400),
    dimensions: null,
    durationLabel: null,
  };
}

export const MOCK_MEDIA_ASSETS: MediaAsset[] = SEEDS.map((seed, i) => makeAsset(seed, i + 1));
