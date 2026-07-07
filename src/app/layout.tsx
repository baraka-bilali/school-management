import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./no-translate.css";
import ClientOnly from "@/components/client-only";
import PwaShell from "@/components/pwa-shell";
import { ReactQueryProvider } from "@/lib/react-query";

export const metadata: Metadata = {
  title: "Kelasi 360",
  description: "Plateforme de gestion scolaire 360° pour les établissements en RDC",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kelasi 360",
  },
  icons: {
    icon: [
      { url: "/icons/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="google" content="notranslate" />
      </head>
      <body className="bg-gray-50 font-sans antialiased notranslate" suppressHydrationWarning>
        <ReactQueryProvider>
          <ClientOnly>
            {children}
            <PwaShell />
          </ClientOnly>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
