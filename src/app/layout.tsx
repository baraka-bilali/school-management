import type { Metadata } from "next";
import "./globals.css";
import "./no-translate.css";
import ClientOnly from "@/components/client-only";

export const metadata: Metadata = {
  title: "School Management",
  description: "Système de gestion scolaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="bg-gray-50 font-sans antialiased notranslate" suppressHydrationWarning>
        <ClientOnly>
          {children}
        </ClientOnly>
      </body>
    </html>
  );
}
