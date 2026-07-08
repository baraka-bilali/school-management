import TeacherLayout from "@/components/teacher/teacher-layout"
import { TeacherProvider } from "@/components/teacher/teacher-context"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherProvider>
      <TeacherLayout>{children}</TeacherLayout>
    </TeacherProvider>
  )
}
