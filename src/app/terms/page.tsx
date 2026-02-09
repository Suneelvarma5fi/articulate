import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl py-12">
        <Link
          href="/"
          className="mb-8 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          &larr; Back
        </Link>

        <h1 className="mb-6 text-2xl font-bold tracking-wide text-white">
          TERMS OF SERVICE
        </h1>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Last updated: February 2026</p>

          <h2 className="pt-4 text-base font-bold text-white">
            Acceptance of Terms
          </h2>
          <p>
            By using Articulation Training, you agree to these terms. If you
            do not agree, do not use the service.
          </p>

          <h2 className="pt-4 text-base font-bold text-white">
            Service Description
          </h2>
          <p>
            Articulation Training is a platform for practicing visual
            description skills. You describe reference images, generate AI
            images from your descriptions, and receive similarity scores.
          </p>

          <h2 className="pt-4 text-base font-bold text-white">
            Credits and Payments
          </h2>
          <p>
            Credits are required to generate images. Credits can be purchased
            via Stripe. New users receive 50 free credits upon registration.
            Credits are non-transferable between accounts.
          </p>

          <h2 className="pt-4 text-base font-bold text-white">
            User Content
          </h2>
          <p>
            You retain ownership of your articulation text submissions. By
            submitting challenges for review, you grant us permission to use
            the submitted images as challenge content.
          </p>

          <h2 className="pt-4 text-base font-bold text-white">
            Acceptable Use
          </h2>
          <p>
            You agree not to submit harmful, offensive, or illegal content.
            Articulations should be your own original descriptions. Automated
            or AI-generated submissions may be flagged and rejected.
          </p>

          <h2 className="pt-4 text-base font-bold text-white">
            Limitation of Liability
          </h2>
          <p>
            The service is provided as-is. We are not liable for any damages
            arising from use of the service, including but not limited to
            inaccurate scoring or service interruptions.
          </p>
        </div>
      </div>
    </main>
  );
}
