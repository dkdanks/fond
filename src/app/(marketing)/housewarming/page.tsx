import { EventTypePage } from '@/components/marketing/event-type-page'

export default function HousewarmingPage() {
  return (
    <EventTypePage
      config={{
        label: 'Housewarming',
        headline: 'Make your new place feel like home.',
        tagline:
          'Share your new chapter and let the people who matter help you settle in — with contributions toward what you actually need.',
        accent: '#D4C8BC',
        features: [
          {
            title: 'Share your new chapter',
            body: 'Tell your story, add your address and moving-in details, and give guests everything they need in one place.',
          },
          {
            title: 'Funds for what makes a home',
            body: 'Create funds for furniture, appliances, renovations, or experiences. Guests pick what resonates and contribute any amount.',
          },
          {
            title: 'Invite and track RSVPs',
            body: 'Send invitations and see who\'s coming, all from one simple dashboard.',
          },
          {
            title: 'Contributions from anywhere',
            body: 'Friends and family near and far can contribute in any amount, in their local currency.',
          },
        ],
        reviews: [
          {
            quote:
              'I was nervous about asking for money. The way Joyabl frames it — as funds for experiences and things you need — made it feel thoughtful, not grabby.',
            name: 'Olivia R.',
            location: 'Auckland, NZ',
          },
          {
            quote:
              'We just moved into our first home and had nothing. Our guests loved being able to contribute to specific things — the sofa fund filled up in two days.',
            name: 'Ben & Chloe',
            location: 'Perth, WA',
          },
        ],
      }}
    />
  )
}
