import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link
        href="/"
        className="mb-8 font-handjet text-2xl tracking-wider text-foreground"
      >
        ARTICULATE_
      </Link>
      <SignIn afterSignInUrl="/dashboard" />
      <p className="mt-8 text-xs text-muted-foreground">
        Describe. Generate. Score.
      </p>
    </main>
  );
}
