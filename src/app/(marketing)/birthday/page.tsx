import { EventTypePage } from '@/components/marketing/event-type-page'

export default function BirthdayPage() {
  return (
    <EventTypePage
      config={{
        label: 'Birthday',
        headline: 'The birthday registry, reimagined.',
        tagline:
          'Because the best gifts are the ones you actually want. Create a page, share your funds, and celebrate the way you deserve.',
        accent: '#D0CCBC',
        features: [
          {
            title: 'Your celebration, your page',
            body: 'Share your plans, add your details, and give guests one beautiful link with everything they need.',
          },
          {
            title: 'Gifts that actually mean something',
            body: 'Create funds for experiences, adventures, dinners, travel — anything you\'ve been putting off. Guests contribute any amount.',
          },
          {
            title: 'No more unwanted gifts',
            body: 'Your guests know exactly what to give — and feel great doing it. No returns, no re-gifting.',
          },
          {
            title: 'Contributions from anyone, anywhere',
            body: 'Friends and family near and far can contribute in any amount, in their local currency.',
          },
        ],
        reviews: [
          {
            quote:
              'I turned 40 this year and didn\'t want a pile of things I didn\'t need. Joyabl let me set up funds for a trip I\'d been putting off for years. Best birthday ever.',
            name: 'Kate M.',
            location: 'Sydney, NSW',
          },
          {
            quote:
              'Simple, fast, and our friends actually used it. Setting up took less than an hour and we had contributions coming in within the day.',
            name: 'Liam & friends',
            location: 'Melbourne, VIC',
          },
        ],
      }}
    />
  )
}
