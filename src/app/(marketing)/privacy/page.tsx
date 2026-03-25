export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20" style={{ color: '#2C2B26' }}>
      <p className="text-sm mb-2" style={{ color: '#B5A98A' }}>Last updated: March 2026</p>
      <h1 className="text-3xl font-semibold mb-10">Privacy Policy</h1>

      <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: '#4A3728' }}>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>1. Who we are</h2>
          <p>Joyabl operates the joyabl.com platform, which allows people to create event pages, manage guest lists, and accept gift contributions. References to &ldquo;Joyabl&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo; in this policy refer to the Joyabl platform and its operators.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>2. Information we collect</h2>
          <p className="mb-3">We collect information you provide directly to us:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li><strong>Account information</strong> — name, email address, and password when you create an account.</li>
            <li><strong>Event information</strong> — details about your event including title, date, location, photos, and guest list.</li>
            <li><strong>Contribution information</strong> — contributor names, email addresses, messages, and payment details. Payment card data is processed directly by Stripe and never stored on our servers.</li>
            <li><strong>Usage data</strong> — how you interact with the platform, including pages visited and features used.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>3. How we use your information</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>To provide and improve the Joyabl platform.</li>
            <li>To process contributions and send receipts.</li>
            <li>To send event invitations on your behalf to your guests.</li>
            <li>To communicate with you about your account and our services.</li>
            <li>To comply with legal obligations, including Australian tax law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>4. Information sharing</h2>
          <p className="mb-3">We do not sell your personal information. We share data only with:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li><strong>Stripe</strong> — to process payments securely.</li>
            <li><strong>Supabase</strong> — for database and authentication services.</li>
            <li><strong>Resend</strong> — to deliver emails.</li>
            <li>Law enforcement or regulatory bodies where required by Australian law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>5. Data storage and security</h2>
          <p>Your data is stored on servers located in Australia and the United States. We use industry-standard security measures to protect your information. Payment card data is never stored on our servers — all payment processing is handled by Stripe.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>6. Your rights</h2>
          <p>Under the Australian Privacy Act 1988, you have the right to access, correct, or request deletion of your personal information. To exercise these rights, contact us at privacy@joyabl.com.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>7. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>8. Contact</h2>
          <p>For privacy enquiries, contact us at <a href="mailto:privacy@joyabl.com" style={{ color: '#8B8670' }}>privacy@joyabl.com</a>.</p>
        </section>

      </div>
    </div>
  )
}
