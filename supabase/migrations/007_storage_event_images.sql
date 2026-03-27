-- Create storage bucket and policies for event image uploads.
-- This is idempotent so it can be applied safely to existing environments.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload event images" on storage.objects;
create policy "Authenticated users can upload event images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-images');

drop policy if exists "Public can read event images" on storage.objects;
create policy "Public can read event images"
  on storage.objects for select
  using (bucket_id = 'event-images');
