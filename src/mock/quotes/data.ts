import type { Quote } from "../../types/quote";
import { MOCK_USERS } from "../users/data";
import { daysAgo } from "../shared/utils";

const QUOTE_TEXTS: string[] = [
  "The only bad workout is the one that didn't happen.",
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements are the key to staggering long-term results.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Progress, not perfection.",
  "Sweat is just fat crying.",
  "You don't have to be extreme, just consistent.",
  "A one hour workout is 4% of your day. No excuses.",
  "Take care of your body. It's the only place you have to live.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you thought you couldn't.",
  "The pain of discipline is far less than the pain of regret.",
  "Every workout counts, even the ones you didn't want to start.",
];

function makeQuote(text: string, index: number): Quote {
  const admin = MOCK_USERS[index % MOCK_USERS.length];
  return {
    id: `quote_${index + 1}`,
    text,
    updatedBy: `${admin.firstName} ${admin.lastName}`,
    updatedAt: daysAgo(index * 5 + 2),
  };
}

export const MOCK_QUOTES: Quote[] = QUOTE_TEXTS.map((text, index) => makeQuote(text, index));
