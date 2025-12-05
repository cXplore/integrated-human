import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Integrated Human",
  description: "Live stronger, feel deeper, become whole. Mind, body, soul and relationships — integrated.",
  openGraph: {
    title: "Integrated Human",
    description: "Live stronger, feel deeper, become whole. Mind, body, soul and relationships — integrated.",
    url: "https://integrated-human.vercel.app",
    siteName: "Integrated Human",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Integrated Human",
    description: "Live stronger, feel deeper, become whole.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${inter.variable} antialiased`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
