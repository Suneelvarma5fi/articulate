export type ChallengeStatus = "draft" | "scheduled" | "active" | "archived";
export type TransactionType = "signup_bonus" | "image_generation" | "purchase";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface User {
  clerk_user_id: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  reference_image_url: string;
  categories: string[];
  character_limit: number;
  active_date: string;
  status: ChallengeStatus;
  created_at: string;
  created_by: string;
}

export interface Attempt {
  id: string;
  clerk_user_id: string;
  challenge_id: string;
  articulation_text: string;
  character_count: number;
  quality_level: number;
  credits_spent: number;
  generated_image_url: string;
  score: number;
  is_validated: boolean;
  validation_reason: string | null;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  clerk_user_id: string;
  amount: number;
  transaction_type: TransactionType;
  quality_level: number | null;
  related_attempt_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface ChallengeSubmission {
  id: string;
  submitted_by_user_id: string;
  reference_image_url: string;
  title: string;
  categories: string[];
  character_limit: number;
  status: SubmissionStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export const CREDITS_PER_GENERATION = 1;

export const CREDIT_PACKAGES = [
  { credits: 20, price: 499, label: "20 CREDITS", priceLabel: "$4.99", perCredit: "$0.25" },
  {
    credits: 60,
    price: 999,
    label: "60 CREDITS",
    priceLabel: "$9.99",
    perCredit: "$0.17",
    badge: "POPULAR",
  },
  {
    credits: 150,
    price: 1999,
    label: "150 CREDITS",
    priceLabel: "$19.99",
    perCredit: "$0.13",
    badge: "BEST VALUE",
  },
] as const;

export const CATEGORIES = [
  "Product Photography",
  "Architectural Visualization",
  "Fashion & Apparel",
  "Food & Beverage",
  "Landscape & Nature",
  "Portrait & People",
  "Abstract & Conceptual",
  "Interior Design",
  "Automotive",
  "Brand & Marketing",
] as const;

// Dodo Payments product IDs — filled in after creating products in dashboard
export const DODO_PRODUCT_IDS: string[] = [
  process.env.NEXT_PUBLIC_DODO_PRODUCT_STARTER || "",  // 20 credits
  process.env.NEXT_PUBLIC_DODO_PRODUCT_STANDARD || "",  // 100 credits
  process.env.NEXT_PUBLIC_DODO_PRODUCT_PRO || "",       // 300 credits
];

export const INITIAL_CREDITS = 5;
