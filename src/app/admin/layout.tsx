import Layout from "@/components/layout"

/**
 * Shell admin partagé : Header, Sidebar et bottom nav restent montés
 * lors des navigations entre pages /admin/*.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
