export type ChallengeStatus = "draft" | "scheduled" | "active" | "archived";
export type QualityLevel = 1 | 2 | 3;
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
  quality_level: QualityLevel;
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
  quality_level: QualityLevel | null;
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

export const QUALITY_CREDITS: Record<QualityLevel, number> = {
  1: 0.5,
  2: 1,
  3: 2,
};

export const QUALITY_LABELS: Record<
  QualityLevel,
  { name: string; icon: string }
> = {
  1: { name: "FAST", icon: "⚡" },
  2: { name: "STANDARD", icon: "⭐" },
  3: { name: "HIGH", icon: "💎" },
};

export const CREDIT_PACKAGES = [
  { credits: 50, price: 299, label: "50 CREDITS", priceLabel: "$2.99" },
  {
    credits: 150,
    price: 699,
    label: "150 CREDITS",
    priceLabel: "$6.99",
    badge: "BEST VALUE",
  },
  {
    credits: 500,
    price: 1999,
    label: "500 CREDITS",
    priceLabel: "$19.99",
    badge: "MOST CREDITS",
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

export const INITIAL_CREDITS = 50;
