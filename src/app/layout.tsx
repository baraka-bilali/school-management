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
    statusBarStyle: "black-translucent",
    title: "Kelasi 360",
  },
  applicationName: "Kelasi 360",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/icons/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
        {/* Applique le thème avant le premier rendu pour éviter le flash (FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark';var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/favicon.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 font-sans antialiased notranslate" suppressHydrationWarning>
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
