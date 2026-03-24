import { EventTypePage } from '@/components/marketing/event-type-page'

export default function WeddingPage() {
  return (
    <EventTypePage
      config={{
        label: 'Wedding',
        headline: 'Your wedding registry, done beautifully.',
        tagline:
          'One page for your story, your schedule, and everything your guests need — from save the date to the last contribution.',
        accent: '#D4CCBC',
        features: [
          {
            title: 'Tell your story',
            body: 'Share your love story, venue, schedule, and travel info. Everything your guests need, in one beautiful link.',
          },
          {
            title: 'RSVPs and meal preferences',
            body: 'Guests RSVP with meal choices and plus-one details. Track everything from one dashboard — no spreadsheets.',
          },
          {
            title: 'Funds for what you actually want',
            body: "Create funds for your honeymoon, a home, experiences, or anything you've dreamed of. Guests contribute any amount.",
          },
          {
            title: 'Beautiful email invitations',
            body: 'Send branded invitations directly from Joyabl. Guests click straight through to your page.',
          },
        ],
        reviews: [
          {
            quote:
              'We\'d spent weeks stressing about the registry. Setting up with Joyabl took an afternoon — our guests said it was the most beautiful invitation link they\'d ever received.',
            name: 'Sarah & Tom',
            location: 'Sydney, NSW',
          },
          {
            quote:
              'The fund idea was perfect for us. Instead of random gifts, we got contributions toward the honeymoon we\'d been dreaming about for years.',
            name: 'James & Marcus',
            location: 'Brisbane, QLD',
          },
        ],
      }}
    />
  )
}
