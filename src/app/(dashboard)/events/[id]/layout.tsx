import { requireOwnedEvent } from '@/lib/dashboard-server'
import { AppSidebar } from '@/components/app/sidebar'

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user } = await requireOwnedEvent(id, 'id, user_id')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FAFAF7' }}>
      <AppSidebar eventId={id} userEmail={user.email} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
