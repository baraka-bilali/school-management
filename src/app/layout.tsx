import type { Metadata, Viewport } from "next"
import "./globals.css"
import "./no-translate.css"
import ClientOnly from "@/components/client-only"
import PwaShell from "@/components/pwa-shell"
import { ReactQueryProvider } from "@/lib/react-query"
import { Toaster } from "sonner"

const SITE_URL = "https://kelasi360.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kelasi 360 — Gestion scolaire pour les écoles en RDC",
    template: "%s | Kelasi 360",
  },
  description:
    "Kelasi 360 (Kelasi) est la plateforme de gestion scolaire 360° pour les établissements en RDC : élèves, notes, frais, parents, trésorerie et passages.",
  applicationName: "Kelasi 360",
  authors: [{ name: "digicreateam", url: "https://digicreateam.com" }],
  creator: "digicreateam",
  publisher: "Kelasi 360",
  keywords: [
    "Kelasi",
    "Kelasi 360",
    "kelasi360",
    "gestion scolaire",
    "logiciel scolaire RDC",
    "école Congo",
    "notes bulletins",
    "frais scolaires",
    "plateforme scolaire",
  ],
  category: "education",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kelasi 360",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Kelasi 360",
    title: "Kelasi 360 — Gestion scolaire pour les écoles en RDC",
    description:
      "Kelasi 360 : la plateforme scolaire complète pour administrer votre établissement en République Démocratique du Congo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kelasi 360 — Gestion scolaire RDC",
    description:
      "Plateforme Kelasi 360 pour gérer élèves, notes, frais et communication école–parents.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icons/favicon.png", type: "image/png", sizes: "512x512" }],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/icons/favicon.png",
  },
  verification: {
    google: "PbiyPc_qDzSGpVKnxNVk2e-OONuaQcS8iBQM4kR0jmA",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="google" content="notranslate" />
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
      <body className="min-h-dvh bg-[#eef2f9] dark:bg-gray-900 font-sans antialiased notranslate" suppressHydrationWarning>
        <ReactQueryProvider>
          {children}
          <ClientOnly>
            <PwaShell />
          </ClientOnly>
          <Toaster richColors position="top-center" closeButton />
        </ReactQueryProvider>
      </body>
    </html>
  )
}
