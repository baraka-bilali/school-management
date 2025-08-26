import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
