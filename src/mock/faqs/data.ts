import type { Faq, FaqCategory, FaqStatus } from "../../types/faq";
import { daysAgo } from "../shared/utils";

export const FAQ_CATEGORIES: FaqCategory[] = ["General", "Billing", "Coaching", "Nutrition", "Technical", "Account"];

interface FaqSeed {
  question: string;
  answer: string;
  category: FaqCategory;
  status?: FaqStatus;
}

const SEEDS: FaqSeed[] = [
  {
    question: "How do I reset my password?",
    answer:
      "Open the app, go to the login screen and tap 'Forgot Password'. Enter the email address linked to your account and you'll receive a reset link within a few minutes. If you don't see it, check your spam folder before requesting another one.",
    category: "Account",
  },
  {
    question: "How do I update my profile information?",
    answer:
      "Go to Profile > Edit Profile from the app menu. You can update your name, contact details, height, weight and fitness goals there. Changes are saved automatically once you tap Save.",
    category: "Account",
  },
  {
    question: "What subscription plans does GoGetFit offer?",
    answer:
      "We offer Monthly, Quarterly and Annual plans, each available with or without a dedicated personal coach. Annual plans include the best per-month value and a free body transformation review every quarter.",
    category: "Billing",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "Navigate to Settings > Subscription > Manage Plan and tap Cancel Subscription. Your plan will remain active until the end of the current billing cycle, and you won't be charged again after that.",
    category: "Billing",
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer:
      "Refunds are evaluated on a case-by-case basis within 7 days of purchase, provided you haven't used more than two coaching sessions. Reach out to support from within the app to start a refund request.",
    category: "Billing",
  },
  {
    question: "How is my personal coach assigned?",
    answer:
      "When you subscribe to a coached plan, our system matches you with a coach based on your fitness goals, preferred language and schedule availability. You can request a coach change once every 30 days from Settings > Coaching.",
    category: "Coaching",
  },
  {
    question: "How often should I expect to hear from my coach?",
    answer:
      "Coaches review your logged workouts and nutrition weekly and send a check-in message every Monday. You can message your coach directly at any time through the in-app chat for urgent questions.",
    category: "Coaching",
  },
  {
    question: "Can I switch coaches if I'm not happy with the fit?",
    answer:
      "Yes. Go to Settings > Coaching > Request Coach Change and describe what you're looking for. Our team will match you with a new coach within 2 business days at no extra cost.",
    category: "Coaching",
  },
  {
    question: "How do I log a meal that isn't in the food database?",
    answer:
      "From the Nutrition tab, tap 'Log Food' then 'Can't find it? Request it'. Fill in the food name and an estimated serving size — our nutrition team typically adds verified entries within 48 hours.",
    category: "Nutrition",
  },
  {
    question: "How are my daily calorie and macro targets calculated?",
    answer:
      "We calculate your BMR using the Mifflin-St Jeor formula from your height, weight, age and gender, then apply an activity multiplier and adjust based on your goal (fat loss, maintenance or muscle gain) set during onboarding.",
    category: "Nutrition",
  },
  {
    question: "Can I follow a vegetarian or vegan diet plan?",
    answer:
      "Absolutely. When setting up or editing your diet preferences, select Vegetarian, Vegan, Eggetarian or Non-Vegetarian and your coach will tailor your meal plan and food suggestions accordingly.",
    category: "Nutrition",
  },
  {
    question: "The app crashes when I try to upload a progress photo — what do I do?",
    answer:
      "First, make sure the app is updated to the latest version from your app store. If it still crashes, try clearing the app cache under phone Settings > Apps > GoGetFit > Storage, then restart the app. If the issue persists, contact support with your device model and OS version.",
    category: "Technical",
  },
  {
    question: "Why isn't my step count syncing from my fitness tracker?",
    answer:
      "Ensure GoGetFit has permission to read activity data from Google Fit or Apple Health in your phone's privacy settings. Syncing can take up to 15 minutes after a workout; if it's still missing after that, try disconnecting and reconnecting the integration under Settings > Connected Apps.",
    category: "Technical",
  },
  {
    question: "Which devices and OS versions does GoGetFit support?",
    answer:
      "GoGetFit supports Android 8.0+ and iOS 14+. For the smoothest experience, including video call coaching sessions, we recommend keeping your device on the latest available OS update.",
    category: "Technical",
  },
  {
    question: "What is GoGetFit?",
    answer:
      "GoGetFit is a fitness and nutrition coaching platform that pairs you with a certified personal coach, personalized workout plans, diet tracking and a supportive community to help you reach your health goals.",
    category: "General",
  },
  {
    question: "Is my data safe and private?",
    answer:
      "Yes. All personal and health data is encrypted in transit and at rest, and is only ever visible to you and the coach assigned to your account. We never sell user data to third parties.",
    category: "General",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "New users get a 7-day free trial with full access to workout and nutrition tracking. Coaching features unlock once you choose a paid plan at the end of the trial.",
    category: "General",
    status: "Archived",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "Tap the Help icon from any screen or email support@gogetfit.in. Our team typically responds within 24 hours on business days.",
    category: "General",
  },
];

function makeFaq(seed: FaqSeed, index: number): Faq {
  return {
    id: `faq_${index + 1}`,
    question: seed.question,
    answer: seed.answer,
    category: seed.category,
    status: seed.status ?? "Published",
    order: index + 1,
    updatedAt: daysAgo(index * 3 + 1),
  };
}

export const MOCK_FAQS: Faq[] = SEEDS.map((seed, index) => makeFaq(seed, index));
