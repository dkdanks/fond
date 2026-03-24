import { EventTypePage } from '@/components/marketing/event-type-page'

export default function BabyShowerPage() {
  return (
    <EventTypePage
      config={{
        label: 'Baby Shower',
        headline: 'Welcome your little one in style.',
        tagline:
          'Create a page that tells your story and lets guests contribute to exactly what your family needs — no guessing, no returns.',
        accent: '#C8D4C4',
        features: [
          {
            title: 'Share your news',
            body: 'Tell your story, add your due date, and give guests all the details they need to celebrate with you.',
          },
          {
            title: 'Funds for what your family actually needs',
            body: 'Create funds for a pram, nursery, childcare, experiences — whatever matters most to your growing family.',
          },
          {
            title: 'Guest list and RSVPs',
            body: 'Invite your guests and track who\'s coming, all from one simple dashboard.',
          },
          {
            title: 'Contributions from anyone, anywhere',
            body: 'Family and friends near and far can contribute in any amount, in their local currency.',
          },
        ],
        reviews: [
          {
            quote:
              'The fund idea changed everything. Instead of getting things we didn\'t need, we got contributions toward our first family holiday. We\'re going in March.',
            name: 'Priya K.',
            location: 'Melbourne, VIC',
          },
          {
            quote:
              'My sister set this up for me and I was blown away. Our guests loved it — so much easier than a traditional registry and everything we actually needed.',
            name: 'Rachel & Dan',
            location: 'Auckland, NZ',
          },
        ],
      }}
    />
  )
}
