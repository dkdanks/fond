import { Cursor } from '@/components/marketing/cursor'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cursor />
      {children}
    </>
  )
}
