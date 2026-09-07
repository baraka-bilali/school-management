import ParentLayout from "@/components/parent/parent-layout"
import { ParentProvider } from "@/components/parent/parent-context"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ParentProvider>
      <ParentLayout>{children}</ParentLayout>
    </ParentProvider>
  )
}
