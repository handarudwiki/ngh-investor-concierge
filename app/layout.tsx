import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const display = Instrument_Serif({
  variable: "--font-display-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NGH Investor Concierge",
    template: "%s · NGH Concierge",
  },
  description:
    "24/7 multilingual AI concierge that answers, qualifies and books foreign investor leads for NGH Property Group.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
