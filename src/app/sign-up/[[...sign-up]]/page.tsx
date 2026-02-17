import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        backgroundColor: "#DDDDD1",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <Link
        href="/"
        className="mb-8 text-2xl tracking-wider text-[#2a2a2a]"
      >
        ARTICULATE_
      </Link>
      <SignUp afterSignUpUrl="/dashboard" />
      <p className="mt-8 text-xs tracking-wide text-[#2a2a2a]/40">
        5 free credits to start. No card needed.
      </p>
    </main>
  );
}
