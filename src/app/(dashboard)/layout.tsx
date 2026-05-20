import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ToastProvider } from '@/components/app/toast-provider'
import { DashboardNav } from '@/components/dashboard/nav'
import { canCreateAnotherUpcomingEvent } from '@/lib/events'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from('profiles').select('id, name, email, created_at').eq('id', user.id).single(),
    supabase
      .from('events')
      .select('id, title, date, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <ToastProvider>
      <DashboardNav
        profile={profile}
        events={events ?? []}
        canCreateEvent={canCreateAnotherUpcomingEvent(events ?? [])}
      />
      {children}
    </ToastProvider>
  )
}
