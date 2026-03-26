-- ─── RLS Policies ────────────────────────────────────────────────────────────
--
-- These policies must be applied in the Supabase dashboard
-- (Authentication > Policies) or via a migration file.
-- Run `supabase db push` after adding to migrations.
--
-- NOTE: These are NOT auto-applied. They are documentation + reference for the
-- developer to apply manually or via `supabase/migrations/`.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── events ───────────────────────────────────────────────────────────────────
-- Anyone can read published events (for public /e/[slug] pages)
-- Only the owner can read, insert, update, delete their own events

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published events"
  ON events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Owners can read their own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);


-- ─── guests ───────────────────────────────────────────────────────────────────
-- Only the event owner can read and write guests for their events.
-- Ownership is determined by a subquery on events.user_id.

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read guests for their events"
  ON guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert guests for their events"
  ON guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update guests for their events"
  ON guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
        AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete guests for their events"
  ON guests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
        AND events.user_id = auth.uid()
    )
  );


-- ─── registry_pools ───────────────────────────────────────────────────────────
-- Event owner can read/write their registry pools.
-- Public can read pools for published events (for the public /e/[slug] page).

ALTER TABLE registry_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read registry pools for published events"
  ON registry_pools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registry_pools.event_id
        AND events.status = 'published'
    )
  );

CREATE POLICY "Owners can read their own registry pools"
  ON registry_pools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registry_pools.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert registry pools"
  ON registry_pools FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registry_pools.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their registry pools"
  ON registry_pools FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registry_pools.event_id
        AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registry_pools.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their registry pools"
  ON registry_pools FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registry_pools.event_id
        AND events.user_id = auth.uid()
    )
  );


-- ─── contributions ────────────────────────────────────────────────────────────
-- Event owner can read all contributions for their event.
-- Anyone (public) can insert a new contribution (guest making a gift payment).
-- Only the owner can update or delete contributions.

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read contributions for their events"
  ON contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert contributions"
  ON contributions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can update contributions for their events"
  ON contributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
        AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete contributions for their events"
  ON contributions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
        AND events.user_id = auth.uid()
    )
  );


-- ─── rsvp_questions ───────────────────────────────────────────────────────────
-- Event owner can read/write RSVP questions for their events.
-- Public can read RSVP questions for published events (to render the RSVP form).

ALTER TABLE rsvp_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read rsvp_questions for published events"
  ON rsvp_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvp_questions.event_id
        AND events.status = 'published'
    )
  );

CREATE POLICY "Owners can read their own rsvp_questions"
  ON rsvp_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvp_questions.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert rsvp_questions"
  ON rsvp_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvp_questions.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their rsvp_questions"
  ON rsvp_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvp_questions.event_id
        AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvp_questions.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their rsvp_questions"
  ON rsvp_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvp_questions.event_id
        AND events.user_id = auth.uid()
    )
  );


-- ─── storage.objects (event-images bucket) ────────────────────────────────────
-- Authenticated users can upload images to the event-images bucket.
-- Public (anonymous) can read/download images from the bucket.

-- Enable RLS on storage.objects is managed by Supabase automatically.
-- Apply the following policies via the Supabase dashboard under
-- Storage > event-images > Policies, or use the SQL editor.

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Public can read event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');
