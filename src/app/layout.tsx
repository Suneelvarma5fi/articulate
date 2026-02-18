import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { Handjet } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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
          colorBackground: "#F5F4F0",
          colorText: "#1A1A1A",
          colorTextSecondary: "#6B6B6B",
          colorPrimary: "#DC2626",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#1A1A1A",
          fontFamily: "var(--font-geist-sans), sans-serif",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "shadow-sm border border-black/[0.06] !bg-white",
          headerTitle: "font-handjet tracking-wider",
          headerSubtitle: "text-[#6B6B6B]",
          formButtonPrimary:
            "bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium tracking-wide text-sm rounded-full",
          formFieldInput:
            "border-black/[0.06] bg-white rounded-lg",
          formFieldLabel: "text-[#1A1A1A]/70",
          footerActionLink: "text-[#DC2626] hover:text-[#B91C1C]",
          socialButtonsBlockButton:
            "border-black/[0.06] rounded-lg hover:bg-[#F5F4F0]",
          dividerLine: "bg-black/[0.06]",
          dividerText: "text-[#9B9B9B]",
          userButtonPopoverCard: "border border-black/[0.06] !bg-white shadow-lg",
          userButtonPopoverActionButton: "hover:bg-[#F5F4F0]",
          userButtonPopoverFooter: "hidden",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${handjet.variable} font-sans antialiased`}
        >
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
