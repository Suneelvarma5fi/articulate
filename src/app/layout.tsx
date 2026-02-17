import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { Handjet } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const handjet = Handjet({
  subsets: ["latin"],
  variable: "--font-handjet",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Articulate",
  description:
    "Can you describe an image so well that AI recreates it? Daily challenges to sharpen your visual articulation skills.",
  icons: {
    icon: "/FAVICON.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: "#E0E0D5",
          colorText: "#2a2a2a",
          colorTextSecondary: "#6b6b6b",
          colorPrimary: "#2a2a2a",
          colorInputBackground: "#D5D5C9",
          colorInputText: "#2a2a2a",
          fontFamily: "var(--font-handjet), monospace",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "shadow-none border border-[#2a2a2a]/15 !bg-[#E0E0D5]",
          headerTitle: "font-handjet tracking-wider",
          headerSubtitle: "font-handjet tracking-wide",
          formButtonPrimary:
            "bg-[#2a2a2a] hover:bg-[#2a2a2a]/90 text-[#DDDDD1] font-handjet tracking-wider text-sm rounded-full",
          formFieldInput:
            "border-[#2a2a2a]/15 bg-[#D5D5C9] font-handjet tracking-wide rounded-lg",
          formFieldLabel: "font-handjet tracking-wide text-[#2a2a2a]/70",
          footerActionLink: "text-[#2a2a2a] font-handjet hover:text-[#2a2a2a]/70",
          socialButtonsBlockButton:
            "border-[#2a2a2a]/15 font-handjet tracking-wide rounded-lg hover:bg-[#D5D5C9]",
          dividerLine: "bg-[#2a2a2a]/10",
          dividerText: "font-handjet text-[#2a2a2a]/40",
          userButtonPopoverCard: "border border-[#2a2a2a]/15 !bg-[#E0E0D5]",
          userButtonPopoverActionButton: "font-handjet tracking-wide",
          userButtonPopoverFooter: "hidden",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${handjet.variable} font-handjet antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
