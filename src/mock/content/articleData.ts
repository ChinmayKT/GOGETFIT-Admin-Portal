import type { Article, ArticleStatus } from "../../types/content";
import { randomInt, daysAgo, daysFromNow, pick } from "../shared/utils";

export const ARTICLE_AUTHORS = ["Chinmay", "Priya Sharma", "Karthik Rao", "Ananya Iyer", "Rohan Gupta"];

const TITLES = [
  "5 Warm-Up Routines to Prevent Injury",
  "The Science of Progressive Overload",
  "How Much Protein Do You Really Need?",
  "Building a Sustainable Home Workout Habit",
  "Understanding Your Basal Metabolic Rate",
  "Recovery Days: Why Rest Is Part of the Plan",
  "Postnatal Fitness: A Gentle Return to Training",
  "Meal Prepping for Busy Professionals",
  "Breaking Through a Weight Loss Plateau",
  "Strength Training for Long-Term Bone Health",
  "The Beginner's Guide to Tracking Macros",
  "Why Sleep Quality Affects Your Gains",
  "Functional Training vs. Traditional Weightlifting",
  "Hydration Myths Every Client Should Know",
  "Setting Realistic 90-Day Fitness Goals",
  "Mobility Work: The Missing Piece in Most Routines",
];

function makeContent(title: string): string {
  return [
    `## ${title}`,
    "",
    `This article explores **${title.toLowerCase()}** in depth, with practical advice you can apply this week.`,
    "",
    "- Start with a clear, measurable goal",
    "- Track progress weekly, not daily",
    "- Adjust based on real feedback from your body",
    "",
    "Consistency beats intensity over the long run — small, repeatable habits compound into lasting results.",
  ].join("\n");
}

function makeArticle(index: number): Article {
  const title = TITLES[index % TITLES.length];
  const suffix = index >= TITLES.length ? ` (Part ${Math.floor(index / TITLES.length) + 1})` : "";
  const status: ArticleStatus = index % 5 === 0 ? "Scheduled" : index % 3 === 0 ? "Draft" : "Published";

  return {
    id: `article_${index}`,
    title: `${title}${suffix}`,
    description: `A practical guide covering ${title.toLowerCase()} with actionable tips for coaches and clients alike. Written to help members stay consistent and informed on their fitness journey.`,
    content: makeContent(title),
    author: pick(ARTICLE_AUTHORS),
    status,
    scheduledAt: status === "Scheduled" ? daysFromNow(randomInt(1, 21)) : null,
    media: [],
    updatedAt: daysAgo(randomInt(0, 60)),
    createdAt: daysAgo(randomInt(60, 400)),
  };
}

export const MOCK_ARTICLES: Article[] = Array.from({ length: 22 }, (_, i) => makeArticle(i + 1));
