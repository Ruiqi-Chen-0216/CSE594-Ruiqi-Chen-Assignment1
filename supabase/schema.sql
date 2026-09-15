-- A1-2 emotion annotation: submission storage, validation, and access permissions.
-- Installed for the live task. Run once in SQL Editor for an independent database.
begin;

create function public.valid_emotion_answers(value jsonb)
returns boolean language plpgsql immutable strict set search_path = '' as $$
declare item jsonb; seen text[] := array[]::text[];
begin
  if jsonb_typeof(value) <> 'array' then return false; end if;
  if jsonb_array_length(value) <> 5 or octet_length(value::text) > 2048 then return false; end if;
  for item in select jsonb_array_elements(value) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if not (item ?& array['tweet_id', 'selected_label'])
      or (item - 'tweet_id' - 'selected_label') <> '{}'::jsonb
      or jsonb_typeof(item->'tweet_id') <> 'string'
      or jsonb_typeof(item->'selected_label') <> 'string' then return false; end if;
    if (item->>'tweet_id') !~ '^tweet_(00[1-9]|0[1-5][0-9]|060)$'
      or (item->>'selected_label') not in ('anger','fear','joy','love','sadness','surprise')
      or (item->>'tweet_id') = any(seen) then return false; end if;
    seen := array_append(seen, item->>'tweet_id');
  end loop;
  return true;
end;
$$;

create table public.submissions (
  participant_id uuid primary key,
  answers jsonb not null check (public.valid_emotion_answers(answers)),
  dataset_version text not null check (dataset_version = 'emotion-60-reviewed-v1'),
  submitted_at timestamptz not null default now()
);
alter table public.submissions enable row level security;
revoke all on table public.submissions from public, anon, authenticated;
revoke all on function public.valid_emotion_answers(jsonb) from public, anon, authenticated;

-- Exact retries acknowledge the saved submission; conflicting answers are rejected.
-- Public callers access submissions only through this function.
create function public.submit_emotion_task(p_participant_id uuid, p_answers jsonb, p_dataset_version text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare stored public.submissions%rowtype;
begin
  if p_participant_id is null or p_dataset_version is distinct from 'emotion-60-reviewed-v1'
    or p_answers is null or not public.valid_emotion_answers(p_answers) then
    raise sqlstate '22023' using message = 'Invalid submission';
  end if;
  insert into public.submissions (participant_id, answers, dataset_version)
    values (p_participant_id, p_answers, p_dataset_version)
    on conflict (participant_id) do nothing;
  select * into strict stored from public.submissions where participant_id = p_participant_id;
  if stored.answers is distinct from p_answers or stored.dataset_version is distinct from p_dataset_version then
    raise sqlstate '23505' using message = 'Submission conflict';
  end if;
  return true;
end;
$$;
revoke all on function public.submit_emotion_task(uuid, jsonb, text) from public, anon, authenticated;
grant usage on schema public to anon;
grant execute on function public.submit_emotion_task(uuid, jsonb, text) to anon;
commit;
