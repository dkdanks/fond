import { EventTypePage } from '@/components/marketing/event-type-page'

export default function MitzvahPage() {
  return (
    <EventTypePage
      config={{
        label: 'Bar / Bat Mitzvah',
        headline: 'A milestone worth celebrating.',
        tagline:
          'Create a beautiful page for one of life\'s most meaningful occasions — and give guests a way to contribute that\'s as special as the moment itself.',
        accent: '#D8D4C8',
        features: [
          {
            title: 'Everything guests need, in one link',
            body: 'Share the ceremony details, schedule, venue, and all the information guests need to be there for the occasion.',
          },
          {
            title: 'Meaningful contributions',
            body: 'Create funds for education, travel, experiences, or anything that marks the beginning of the next chapter.',
          },
          {
            title: 'RSVPs without the back-and-forth',
            body: 'Manage your guest list and track responses from one clean dashboard — no spreadsheets or group chats required.',
          },
          {
            title: 'Beautiful invitations',
            body: 'Send branded invitations directly from Joyabl. Everything guests need, in one click.',
          },
        ],
        reviews: [
          {
            quote:
              'We wanted our guests to contribute to something meaningful rather than bring gifts. Joyabl made that so easy to communicate — and our guests loved it.',
            name: 'The Goldberg Family',
            location: 'Sydney, NSW',
          },
          {
            quote:
              'The page looked incredible and everything was in one place. Our guests kept telling us how easy it was to RSVP and contribute.',
            name: 'Miriam & David L.',
            location: 'Melbourne, VIC',
          },
        ],
      }}
    />
  )
}
