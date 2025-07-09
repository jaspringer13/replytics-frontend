import { SidebarNav } from "@/components/dashboard/SidebarNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarNav />
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}