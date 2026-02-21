import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl py-12">
        <Link
          href="/"
          className="mb-8 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          &larr; Back
        </Link>

        <h1 className="mb-6 text-2xl font-bold tracking-wide text-foreground">
          PRIVACY POLICY
        </h1>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Last updated: February 2026</p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            Information We Collect
          </h2>
          <p>
            We collect information you provide when creating an account (via
            Clerk authentication), including your email address and name. We
            also collect your articulation text submissions, generated images,
            and scoring data.
          </p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            How We Use Your Information
          </h2>
          <p>
            Your data is used to provide the articulation training service,
            track your progress, and process credit purchases. We do not sell
            your personal information to third parties.
          </p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            Third-Party Services
          </h2>
          <p>
            We use Clerk for authentication, Supabase for data storage, Grok
            API for image generation and scoring, and Dodo Payments for payment
            processing. Each service has its own privacy policy.
          </p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            Data Retention
          </h2>
          <p>
            Your data is retained for as long as your account is active. You
            may request account deletion and data export by contacting us.
          </p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            Your Rights
          </h2>
          <p>
            You have the right to access, export, and delete your personal
            data. Contact us to exercise these rights.
          </p>
        </div>
      </div>
    </main>
  );
}
