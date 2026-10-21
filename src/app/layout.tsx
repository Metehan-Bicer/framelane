import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { captionFontClasses, geist, geistMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Framelane", template: "%s · Framelane" },
  description: "Design, localize and ship App Store screenshots and metadata.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        {/* Hidden element that keeps caption font faces in the stylesheet for the canvas. */}
        <span className={`${captionFontClasses} hidden`} aria-hidden />
        <Suspense>
          <DemoBanner />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
