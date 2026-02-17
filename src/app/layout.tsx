import type { Metadata } from "next";
import "./globals.css";
import "./no-translate.css";
import ClientOnly from "@/components/client-only";

export const metadata: Metadata = {
  title: "digiSchool",
  description: "Plateforme de gestion scolaire digitale",
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
        <ClientOnly>
          {children}
        </ClientOnly>
      </body>
    </html>
  );
}
