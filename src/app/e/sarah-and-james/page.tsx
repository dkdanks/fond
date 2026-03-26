import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sarah & James — 14 June 2025',
  description: "Join us as we celebrate our wedding day. We'd love to share this moment with you.",
}

const PRIMARY = '#2C2B26'
const BG = '#F5F0E8'
const FONT = 'Cormorant Garamond'

export default function SarahAndJamesPage() {
  return (
    <div style={{ fontFamily: `'${FONT}', serif`, background: BG, color: PRIMARY, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>

      {/* Hero */}
      <section className="px-4 py-16 md:px-8 md:py-28 text-center" style={{ background: BG }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-6 opacity-40">You're invited to celebrate</p>
        <h1
          className="text-5xl md:text-7xl font-light mb-5"
          style={{ letterSpacing: '-0.02em', fontStyle: 'italic' }}
        >
          Sarah &amp; James
        </h1>
        <p className="text-base mb-10 opacity-55 tracking-wide">
          14 June 2025 · Kew Gardens, Richmond, London
        </p>
        <p
          className="text-xl leading-relaxed max-w-xl mx-auto mb-12 opacity-75"
          style={{ fontStyle: 'italic', fontWeight: 300 }}
        >
          "After three years, two cities, and one very enthusiastic dog, we're finally tying the knot — and we want you there."
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/e/sarah-and-james/rsvp"
            className="px-10 py-3.5 rounded-full text-sm font-medium tracking-wide transition-opacity hover:opacity-80"
            style={{ background: PRIMARY, color: BG }}
          >
            RSVP
          </Link>
          <p className="text-xs opacity-40">Deadline: 1 May 2025</p>
        </div>
      </section>

      {/* Cover image */}
      <section className="px-4 md:px-8" style={{ borderColor: `${PRIMARY}15` }}>
        <div
          className="max-w-4xl mx-auto rounded-3xl overflow-hidden"
          style={{ aspectRatio: '16/7', background: `${PRIMARY}08` }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>
      </section>

      {/* Our Story */}
      <section className="px-4 py-16 md:px-8 md:py-20 border-t mt-12" style={{ borderColor: `${PRIMARY}12` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-10 opacity-40 text-center">Our Story</p>
        <div className="max-w-2xl mx-auto">
          <p className="text-xl leading-relaxed mb-6 font-medium" style={{ fontStyle: 'italic' }}>
            We met at a mutual friend's dinner party in Notting Hill — James arrived late, knocked over Sarah's wine, and somehow that was the best thing that ever happened to either of us.
          </p>
          <p className="text-base leading-relaxed opacity-65">
            What followed was three years of Sunday markets, weekend escapes to the Cotswolds, arguing about which pasta shape is superior (James is wrong about pappardelle), and realising, slowly and then all at once, that we'd found our person. James proposed on a rainy Tuesday evening on Primrose Hill — not the grand plan, but perfect anyway.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3">
            <div
              className="aspect-[4/3] rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=75)` }}
            />
            <div
              className="aspect-[4/3] rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=800&q=75)` }}
            />
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="px-4 py-16 md:px-8 md:py-20 border-t" style={{ borderColor: `${PRIMARY}12` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-12 opacity-40 text-center">The Day</p>
        <div className="max-w-2xl mx-auto grid gap-8">
          {[
            { time: '2:00 pm', title: 'Ceremony', venue: 'The Nash Conservatory', address: 'Kew Gardens, Richmond, TW9 3AE', notes: 'Guests to be seated by 1:45 pm' },
            { time: '3:30 pm', title: 'Drinks Reception', venue: 'The Orangery Terrace', notes: 'Canapés and champagne in the gardens' },
            { time: '5:30 pm', title: 'Wedding Breakfast', venue: 'The Orangery', notes: 'Three courses, speeches, and a lot of toasts' },
            { time: '8:00 pm', title: 'Evening Reception', venue: 'The Orangery', notes: 'Dancing until midnight — comfortable shoes recommended' },
          ].map(item => (
            <div key={item.title} className="flex gap-6">
              <div className="text-right shrink-0 w-20">
                <p className="text-sm font-medium opacity-50">{item.time}</p>
              </div>
              <div className="flex-1 border-l pl-6" style={{ borderColor: `${PRIMARY}18` }}>
                <p className="font-semibold mb-1">{item.title}</p>
                {item.venue && <p className="text-sm opacity-60">{item.venue}</p>}
                {item.address && <p className="text-xs opacity-40">{item.address}</p>}
                {item.notes && <p className="text-sm mt-2 opacity-55 italic">{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wedding Party */}
      <section className="px-4 py-16 md:px-8 md:py-20 border-t" style={{ borderColor: `${PRIMARY}12` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4 opacity-40 text-center">The Wedding Party</p>
        <p className="text-center text-base opacity-55 mb-12 max-w-lg mx-auto">
          The people who have put up with us planning this for eighteen months and are still speaking to us.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'Emma Clarke', role: 'Maid of Honour', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=75' },
            { name: 'Priya Patel', role: 'Bridesmaid', photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=75' },
            { name: 'Oliver Hughes', role: 'Best Man', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75' },
            { name: 'Tom Reid', role: 'Groomsman', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=75' },
          ].map(m => (
            <div key={m.name} className="text-center">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-3 bg-cover bg-center"
                style={{ backgroundImage: `url(${m.photo})` }}
              />
              <p className="font-medium text-sm">{m.name}</p>
              <p className="text-xs opacity-40 mt-0.5">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Attire */}
      <section className="px-4 py-16 md:px-8 md:py-20 border-t text-center" style={{ borderColor: `${PRIMARY}12` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-6 opacity-40">Attire</p>
        <p className="text-3xl font-light mb-3" style={{ fontStyle: 'italic' }}>Garden Party Formal</p>
        <p className="text-sm opacity-55 max-w-md mx-auto">
          Think florals, pastels, and anything that works with an afternoon in a botanical garden. Black tie is not expected — but wear something you'd feel comfortable dancing in.
        </p>
      </section>

      {/* Travel & Stay */}
      <section className="px-4 py-16 md:px-8 md:py-20 border-t" style={{ borderColor: `${PRIMARY}12` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-8 opacity-40 text-center">Getting There</p>
        <div className="max-w-2xl mx-auto">
          <p className="text-base opacity-65 mb-8 leading-relaxed">
            Kew Gardens is easily accessible by tube (District line, Kew Gardens station — 2 min walk to the Victoria Gate entrance). We recommend public transport as parking is limited on the day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                type: 'Hotel',
                name: 'The Bingham Riverhouse',
                address: 'Richmond, TW10 6HP',
                notes: 'We\'ve reserved a block of rooms at a discounted rate. Quote "Mitchell Wedding" when booking.',
                link: 'https://www.binghamriverhouse.com',
                linkText: 'Book a room',
              },
              {
                type: 'Hotel',
                name: 'Richmond Hill Hotel',
                address: 'Richmond Hill, TW10 6RW',
                notes: 'A 5-minute taxi from Kew Gardens. Good availability and lovely views of the Thames.',
                link: 'https://www.richmondhillhotel.co.uk',
                linkText: 'View hotel',
              },
            ].map(card => (
              <div key={card.name} className="rounded-2xl p-5 border" style={{ borderColor: `${PRIMARY}12` }}>
                <p className="text-xs uppercase tracking-wide opacity-40 mb-2">{card.type}</p>
                <p className="font-semibold mb-1">{card.name}</p>
                <p className="text-xs opacity-50 mb-2">{card.address}</p>
                <p className="text-sm opacity-55 mb-3">{card.notes}</p>
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium underline opacity-60 hover:opacity-100 transition-opacity"
                >
                  {card.linkText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registry */}
      <section className="px-4 py-16 md:px-8 md:py-20 text-center border-t" style={{ borderColor: `${PRIMARY}12` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-6 opacity-40">Registry</p>
        <p className="text-base opacity-65 max-w-xl mx-auto mb-10 leading-relaxed">
          Your presence is the greatest gift. For those who'd like to contribute, we've put together a small collection of experiences and things for our home.
        </p>
        <Link
          href="/e/sarah-and-james/registry"
          className="inline-block px-10 py-3.5 rounded-full text-sm font-medium border transition-opacity hover:opacity-70"
          style={{ borderColor: PRIMARY, color: PRIMARY }}
        >
          View registry
        </Link>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 md:px-8 md:py-20 border-t" style={{ borderColor: `${PRIMARY}12` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-12 opacity-40 text-center">FAQ</p>
        <div className="max-w-2xl mx-auto flex flex-col gap-0">
          {[
            { q: 'Are children welcome?', a: 'We love your little ones, but we\'ve made this an adults-only day so everyone can relax and let their hair down. We hope you understand.' },
            { q: 'Can I bring a plus one?', a: 'Seating is limited, so we\'ve only been able to accommodate the guests named on your invitation. If you have questions, please reach out to us directly.' },
            { q: 'Is there parking at Kew Gardens?', a: 'There is a car park at Kew Gardens but spaces are limited and the surrounding streets can get busy. We strongly recommend taking the tube or a taxi.' },
            { q: 'What if I have dietary requirements?', a: 'Please let us know via the RSVP form and the kitchen will do their best to accommodate you. We have vegetarian, vegan, and gluten-free options.' },
            { q: 'Is there an evening-only invitation?', a: 'Yes — if your invitation says "evening reception", please arrive from 8pm. The party will go on until midnight.' },
          ].map(item => (
            <div
              key={item.q}
              className="border-t pt-5 pb-5"
              style={{ borderColor: `${PRIMARY}12` }}
            >
              <p className="font-semibold mb-2">{item.q}</p>
              <p className="text-sm leading-relaxed opacity-60">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="py-8 text-center border-t" style={{ borderColor: `${PRIMARY}10` }}>
        <p className="text-xs opacity-20">Powered by Joyabl</p>
      </div>
    </div>
  )
}
