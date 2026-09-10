import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à Kelasi 360 (Kelasi) pour accéder à votre espace école, élève, enseignant ou parent.",
  alternates: {
    canonical: "https://kelasi360.com/login",
  },
  openGraph: {
    title: "Connexion | Kelasi 360",
    description: "Accédez à votre compte Kelasi 360.",
    url: "https://kelasi360.com/login",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
