import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { BRAND_LOGO_ALT, BRAND_LOGO_HEIGHT, BRAND_LOGO_URL, BRAND_LOGO_WIDTH } from "@/lib/brand";
import { cn } from "@/lib/utils";

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
        width: BRAND_LOGO_WIDTH,
        height: BRAND_LOGO_HEIGHT,
        alt: BRAND_LOGO_ALT,
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
