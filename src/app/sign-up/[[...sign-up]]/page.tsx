import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link
        href="/"
        className="mb-8 font-handjet text-2xl tracking-wider text-foreground"
      >
        ARTICULATE_
      </Link>
      <SignUp afterSignUpUrl="/dashboard" />
      <p className="mt-8 text-xs text-muted-foreground">
        25 free credits to start. No card needed.
      </p>
    </main>
  );
}
