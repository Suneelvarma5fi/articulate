import Link from "next/link";

export default function RefundPage() {
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
          REFUND POLICY
        </h1>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Last updated: February 2026</p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            Credit Purchases
          </h2>
          <p>
            All credit purchases are final. Credits are non-refundable once
            added to your account, except in cases of technical errors.
          </p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            Failed Generations
          </h2>
          <p>
            If an image generation fails due to a technical error, your
            credits are automatically refunded to your account. No action is
            required on your part.
          </p>

          <h2 className="pt-4 text-base font-bold text-foreground">
            Exceptional Circumstances
          </h2>
          <p>
            If you believe you were charged incorrectly or experienced a
            billing issue, contact us and we will review your case. Refunds
            for exceptional circumstances are handled on a case-by-case basis.
          </p>

          <h2 className="pt-4 text-base font-bold text-foreground">Contact</h2>
          <p>
            For refund inquiries, please reach out to our support team with
            your account email and transaction details.
          </p>
        </div>
      </div>
    </main>
  );
}
