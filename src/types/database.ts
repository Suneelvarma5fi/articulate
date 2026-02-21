export interface ScoreBreakdown {
  subject: number;      // 0-35
  composition: number;  // 0-25
  color: number;        // 0-20
  detail: number;       // 0-20
}

export type ChallengeStatus = "draft" | "scheduled" | "active" | "archived";
export type TransactionType = "signup_bonus" | "image_generation" | "purchase";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface User {
  clerk_user_id: string;
  display_name: string | null;
  bio: string | null;
  interests: string[];
  is_public: boolean;
  invite_code: string | null;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
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
  score_breakdown: ScoreBreakdown | null;
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

export const CREDITS_PER_GENERATION = 5;

export const CREDIT_PACKAGES = [
  { credits: 100, price: 499, label: "100 CREDITS", priceLabel: "$4.99", perCredit: "$0.05" },
  {
    credits: 300,
    price: 999,
    label: "300 CREDITS",
    priceLabel: "$9.99",
    perCredit: "$0.03",
    badge: "POPULAR",
  },
  {
    credits: 750,
    price: 1999,
    label: "750 CREDITS",
    priceLabel: "$19.99",
    perCredit: "$0.03",
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
  process.env.NEXT_PUBLIC_DODO_PRODUCT_STARTER || "",  // 100 credits
  process.env.NEXT_PUBLIC_DODO_PRODUCT_STANDARD || "",  // 300 credits
  process.env.NEXT_PUBLIC_DODO_PRODUCT_PRO || "",       // 750 credits
];

export const INITIAL_CREDITS = 25;
