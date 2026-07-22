-- CourtQuest: Zeffy payment fields + donation notes
-- Run once in Supabase SQL Editor (Dashboard → SQL).
-- Keeps your existing submit_registration intact; the app registers first,
-- then calls attach_registration_payment to store cash/online + fee info.

-- ── registrations: payment + type ───────────────────────────────────────────
alter table public.registrations
  add column if not exists payment_method text not null default 'unpaid',
  add column if not exists paid boolean not null default false,
  add column if not exists paid_at timestamptz,
  add column if not exists registration_type text not null default 'duo',
  add column if not exists preferred_partner text,
  add column if not exists fee_cents int not null default 0,
  add column if not exists donation_message text,
  add column if not exists donation_anonymous boolean not null default false;

do $$ begin
  alter table public.registrations
    drop constraint if exists registrations_payment_method_check;
  alter table public.registrations
    add constraint registrations_payment_method_check
    check (payment_method in ('cash', 'online', 'unpaid'));
exception when others then null;
end $$;

do $$ begin
  alter table public.registrations
    drop constraint if exists registrations_registration_type_check;
  alter table public.registrations
    add constraint registrations_registration_type_check
    check (registration_type in ('individual', 'duo'));
exception when others then null;
end $$;

-- ── donation notes (message / anonymous before Zeffy) ───────────────────────
create table if not exists public.donation_notes (
  id uuid primary key default gen_random_uuid(),
  donor_name text,
  message text,
  anonymous boolean not null default false,
  amount_cents int,
  source text not null default 'zeffy',
  created_at timestamptz not null default now()
);

alter table public.donation_notes enable row level security;

drop policy if exists "Anyone can leave a donation note" on public.donation_notes;
create policy "Anyone can leave a donation note"
  on public.donation_notes for insert
  to anon, authenticated
  with check (true);

create or replace function public.submit_donation_note(
  donor_name_in text default null,
  message_in text default null,
  anonymous_in boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.donation_notes (donor_name, message, anonymous)
  values (
    case when coalesce(anonymous_in, false) then null else nullif(trim(coalesce(donor_name_in, '')), '') end,
    nullif(trim(coalesce(message_in, '')), ''),
    coalesce(anonymous_in, false)
  )
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_donation_note(text, text, boolean) to anon, authenticated;

-- Attach payment details to the newest matching registration for this email.
create or replace function public.attach_registration_payment(
  t_id uuid,
  email_in text,
  registration_type_in text default 'duo',
  preferred_partner_in text default null,
  payment_method_in text default 'cash',
  fee_cents_in int default 0,
  paid_in boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  reg_id uuid;
begin
  if payment_method_in not in ('cash', 'online', 'unpaid') then
    raise exception 'bad payment method';
  end if;

  select id into reg_id
  from public.registrations
  where tournament_id = t_id
    and email = lower(trim(email_in))
  order by created_at desc
  limit 1;

  if reg_id is null then
    raise exception 'registration not found';
  end if;

  update public.registrations set
    payment_method = payment_method_in,
    paid = coalesce(paid_in, false),
    paid_at = case when coalesce(paid_in, false) then now() else paid_at end,
    registration_type = case
      when registration_type_in in ('individual', 'duo') then registration_type_in
      else registration_type
    end,
    preferred_partner = nullif(trim(coalesce(preferred_partner_in, '')), ''),
    fee_cents = coalesce(fee_cents_in, 0)
  where id = reg_id;

  return reg_id;
end;
$$;

grant execute on function public.attach_registration_payment(
  uuid, text, text, text, text, int, boolean
) to anon, authenticated;

create or replace function public.confirm_registration_paid(
  reg_id uuid,
  email_in text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.registrations
  set paid = true,
      paid_at = now(),
      payment_method = case
        when payment_method = 'unpaid' then 'online'
        else payment_method
      end
  where id = reg_id
    and (email_in is null or email = lower(trim(email_in)));
  return found;
end;
$$;

grant execute on function public.confirm_registration_paid(uuid, text) to anon, authenticated;

-- Admin donation notes (PIN must match settings.admin_pin — same as verify_admin).
create or replace function public.admin_list_donation_notes(pin text)
returns setof public.donation_notes
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.settings where admin_pin = pin) then
    -- Also accept admin account session tokens if that table exists
    begin
      if not exists (
        select 1 from public.admin_sessions
        where token = pin and (expires_at is null or expires_at > now())
      ) then
        raise exception 'unauthorized';
      end if;
    exception
      when undefined_table then
        raise exception 'unauthorized';
    end;
  end if;

  return query
    select * from public.donation_notes
    order by created_at desc
    limit 200;
end;
$$;

grant execute on function public.admin_list_donation_notes(text) to anon, authenticated;
