import StudentLayout from "@/components/student/student-layout"
import { StudentProvider } from "@/components/student/student-context"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <StudentProvider>
      <StudentLayout>{children}</StudentLayout>
    </StudentProvider>
  )
}
