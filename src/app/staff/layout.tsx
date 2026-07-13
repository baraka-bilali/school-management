import StaffLayout from "@/components/staff/staff-layout"
import { StaffProvider } from "@/components/staff/staff-context"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <StaffProvider>
      <StaffLayout>{children}</StaffLayout>
    </StaffProvider>
  )
}
