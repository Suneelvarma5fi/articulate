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
          colorPrimary: "#4F46E5",
          fontFamily: "var(--font-geist-sans), sans-serif",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "shadow-sm border border-border !bg-card",
          headerTitle: "font-handjet tracking-wider",
          headerSubtitle: "text-muted-foreground",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground font-medium tracking-wide text-sm rounded-full",
          formFieldInput:
            "border-border bg-background rounded-lg",
          formFieldLabel: "text-foreground/70",
          footerActionLink: "text-primary hover:text-primary/80",
          socialButtonsBlockButton:
            "border-border rounded-lg hover:bg-muted",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          userButtonPopoverCard: "border border-border !bg-card shadow-lg",
          userButtonPopoverActionButton: "hover:bg-muted",
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
