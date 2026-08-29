import type { Banner, BannerRedirectTarget } from "../../types/content";
import { randomInt, daysAgo, daysFromNow } from "../shared/utils";
import { svgImagePlaceholder } from "./placeholder";

const NAMES = [
  "Summer Fat-Loss Sale", "New Year Transformation Challenge", "Coach Karthik Launch Offer",
  "Store Clearance Weekend", "Refer a Friend Program", "30-Day Challenge Enrollment Open",
  "Protein Combo Pack Deal", "Diet Plan Upgrade Offer", "Festive Season Fitness Push",
  "Free Coach Consultation Week", "Yoga & Mobility Spotlight", "Transformation of the Month",
  "Monsoon Home Workout Kit", "Annual Membership Discount",
];

const TARGETS: BannerRedirectTarget[] = ["Home", "Diet Plans", "Challenges", "Store", "Coach Profile", "External URL"];

function makeBanner(index: number): Banner {
  const target = TARGETS[index % TARGETS.length];
  const status = index % 4 === 0 ? "Inactive" : "Active";
  const name = NAMES[index % NAMES.length];

  return {
    id: `banner_${index}`,
    name,
    description: `Promotional banner directing users to ${target === "External URL" ? "an external offer page" : target.toLowerCase()}. Shown on the home feed carousel.`,
    redirectTarget: target,
    redirectUrl: target === "External URL" ? "https://gogetfit.in/offers/seasonal-sale" : null,
    fromDate: daysAgo(randomInt(5, 60)),
    toDate: daysFromNow(randomInt(5, 60)),
    status,
    imageUrl: svgImagePlaceholder(index, name),
    imageFileName: `banner-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.jpg`,
    updatedAt: daysAgo(randomInt(0, 30)),
    createdAt: daysAgo(randomInt(30, 250)),
  };
}

export const MOCK_BANNERS: Banner[] = Array.from({ length: 14 }, (_, i) => makeBanner(i + 1));
