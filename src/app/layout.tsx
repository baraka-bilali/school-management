import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./no-translate.css";
import ClientOnly from "@/components/client-only";
import PwaShell from "@/components/pwa-shell";
import { ReactQueryProvider } from "@/lib/react-query";

export const metadata: Metadata = {
  title: "digiSchool",
  description: "Plateforme de gestion scolaire digitale",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "digiSchool",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
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
