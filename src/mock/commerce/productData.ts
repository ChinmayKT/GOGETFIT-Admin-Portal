import type { Product, ProductSize } from "../../types/commerce";
import { svgImagePlaceholder } from "../content/placeholder";
import { randomInt, daysAgo } from "../shared/utils";

const SIZES: ProductSize[] = ["S/M/L", "S/M", "M/L", "S/L", "One Size", "Free Size"];

interface ProductSeed {
  name: string;
  description: string;
  hasSize: boolean;
}

const PRODUCT_SEEDS: ProductSeed[] = [
  { name: "GoGetFit Steel Shaker Bottle", description: "700ml leak-proof stainless steel shaker with a wire whisk ball for smooth protein shakes on the go.", hasSize: false },
  { name: "GoGetFit Classic Gym Duffel Bag", description: "Water-resistant duffel bag with a dedicated shoe compartment and adjustable shoulder strap.", hasSize: false },
  { name: "GoGetFit Resistance Band Set", description: "Set of 5 latex resistance bands (light to extra-heavy) with a carry pouch for home workouts.", hasSize: false },
  { name: "GoGetFit Performance Dry-Fit Tee", description: "Moisture-wicking dry-fit training tee with breathable mesh side panels and the GoGetFit crest.", hasSize: true },
  { name: "GoGetFit Compression Wrist Wraps", description: "Heavy-duty cotton wrist wraps with thumb loop for added support during heavy lifts.", hasSize: false },
  { name: "GoGetFit Whey Protein Shaker Scoop", description: "Dishwasher-safe measuring scoop that clips onto any GoGetFit shaker for accurate protein dosing.", hasSize: false },
  { name: "GoGetFit Padded Yoga Mat", description: "6mm extra-cushioned non-slip yoga mat with an integrated carry strap.", hasSize: false },
  { name: "GoGetFit Track Jacket", description: "Lightweight zip-up track jacket with thumbhole cuffs, ideal for warm-ups and cool-downs.", hasSize: true },
  { name: "GoGetFit Lifting Straps", description: "Padded neoprene lifting straps for secure grip during deadlifts and pulling movements.", hasSize: false },
  { name: "GoGetFit Foam Roller", description: "High-density foam roller for post-workout muscle recovery and myofascial release.", hasSize: false },
  { name: "GoGetFit Snapback Cap", description: "Structured snapback cap with embroidered GoGetFit logo, adjustable one-size fit.", hasSize: false },
  { name: "GoGetFit Training Shorts", description: "4-way stretch training shorts with a zip pocket, built for squats and conditioning work.", hasSize: true },
  { name: "GoGetFit Gym Towel", description: "Quick-dry microfiber gym towel with a snap loop to clip onto your bag.", hasSize: false },
  { name: "GoGetFit Knee Sleeves (Pair)", description: "7mm neoprene knee sleeves offering compression and joint support for squats.", hasSize: true },
  { name: "GoGetFit Insulated Water Bottle", description: "1L vacuum-insulated bottle that keeps water cold for 24 hours, with a wide mouth for ice.", hasSize: false },
  { name: "GoGetFit Chalk Bag", description: "Drawstring gym chalk bag with belt clip, keeps hands dry during heavy pulls.", hasSize: false },
  { name: "GoGetFit Hoodie", description: "Heavyweight cotton-blend hoodie with kangaroo pocket and embroidered GoGetFit wordmark.", hasSize: true },
  { name: "GoGetFit Jump Rope", description: "Ball-bearing speed rope with adjustable steel cable for double-unders and conditioning.", hasSize: false },
  { name: "GoGetFit Ankle Straps (Pair)", description: "Padded cable-machine ankle straps for glute kickbacks and hip abduction work.", hasSize: false },
  { name: "GoGetFit Sports Cap Visor", description: "Breathable running visor with reflective GoGetFit branding for low-light workouts.", hasSize: false },
  { name: "GoGetFit Compression Leggings", description: "Squat-proof high-waisted compression leggings with a hidden waistband pocket.", hasSize: true },
  { name: "GoGetFit Weightlifting Belt", description: "4-inch suede leather lifting belt with double-prong buckle for heavy compound lifts.", hasSize: true },
  { name: "GoGetFit Sling Bag", description: "Compact crossbody sling bag for phone, cards and keys — fits neatly over gym kit.", hasSize: false },
  { name: "GoGetFit Recovery Slides", description: "Cushioned recovery slides with contoured footbed, perfect for after leg day.", hasSize: true },
];

function makeProduct(seed: ProductSeed, index: number): Product {
  const size = seed.hasSize ? SIZES[index % SIZES.length] : "One Size";
  const status = index % 9 === 0 ? "Inactive" : "Active";
  const createdAt = daysAgo(randomInt(20, 500));
  return {
    id: `product_${index + 1}`,
    name: seed.name,
    description: seed.description,
    points: randomInt(4, 60) * 50,
    size,
    imageUrl: svgImagePlaceholder(index, seed.name),
    imageFileName: null,
    status,
    createdAt,
    updatedAt: createdAt,
  };
}

export const MOCK_PRODUCTS: Product[] = PRODUCT_SEEDS.map((seed, i) => makeProduct(seed, i));
