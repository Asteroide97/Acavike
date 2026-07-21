import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BRAND_LOGO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://acavike.com"),
  title: "Acavike Supplies",
  description: "Catálogo industrial B2B para compras por transferencia y cotización comercial.",
  openGraph: {
    title: "Acavike Supplies",
    description: "Catálogo industrial B2B para compras por transferencia y cotización comercial.",
    images: [
      {
        url: BRAND_LOGO_URL,
        width: 1024,
        height: 1024,
        alt: "Acavike Supplies",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={cn(
          heading.variable,
          body.variable,
          mono.variable,
          "min-h-screen font-body text-foreground",
        )}
      >
        {children}
      </body>
    </html>
  );
}
