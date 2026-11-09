-- Private storage for uploaded study materials.
-- Paths are `<auth uid>/<material id>-<filename>`, so the first folder segment
-- is the ownership boundary.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-materials',
  'study-materials',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "study materials are owned by their user" on storage.objects;
create policy "study materials are owned by their user" on storage.objects
  for all to authenticated
  using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text);
