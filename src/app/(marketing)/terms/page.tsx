export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20" style={{ color: '#2C2B26' }}>
      <p className="text-sm mb-2" style={{ color: '#B5A98A' }}>Last updated: March 2026</p>
      <h1 className="text-3xl font-semibold mb-10">Terms of Service</h1>

      <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: '#4A3728' }}>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>1. Acceptance of terms</h2>
          <p>By using Joyabl, you agree to these terms. If you do not agree, do not use the platform. These terms are governed by the laws of New South Wales, Australia.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>2. The platform</h2>
          <p>Joyabl provides tools to create event pages, manage guest lists, and receive gift contributions. We are a technology platform, not a bank or financial institution. Contributions are processed by Stripe on our behalf.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>3. Fees</h2>
          <p>Joyabl charges a platform fee of <strong>4.98% (GST inclusive)</strong> on each contribution received. This fee covers payment processing costs and the Joyabl platform fee. The net amount after fees is made available to the event organiser.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>4. Payouts</h2>
          <p>Event organisers may request a payout of their available balance at any time. Payouts are processed to the Australian bank account provided by the organiser. We aim to process payout requests within 5 business days. Joyabl is not responsible for delays caused by banking institutions.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>5. Refunds</h2>
          <p>Contributors may request a refund within 30 days if the event organiser agrees. Refund requests should be directed to the event organiser in the first instance. Joyabl will process approved refunds via Stripe.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>6. Acceptable use</h2>
          <p className="mb-3">You agree not to use Joyabl to:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Engage in fraudulent, misleading, or illegal activity.</li>
            <li>Collect contributions for events that do not exist or are materially misrepresented.</li>
            <li>Violate the rights of any third party.</li>
            <li>Attempt to circumvent our fee structure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>7. Account termination</h2>
          <p>We may suspend or terminate accounts that violate these terms, with or without notice. Funds held on behalf of a terminated account will be returned to the organiser after deducting any applicable fees, subject to verification.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>8. Limitation of liability</h2>
          <p>To the extent permitted by Australian law, Joyabl&apos;s liability is limited to the fees paid by you in the 12 months preceding the relevant event. We are not liable for indirect or consequential losses.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>9. Changes to these terms</h2>
          <p>We may update these terms from time to time. We will notify you of material changes by email. Continued use of the platform after notice constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#2C2B26' }}>10. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:hello@joyabl.com" style={{ color: '#8B8670' }}>hello@joyabl.com</a>.</p>
        </section>

      </div>
    </div>
  )
}
