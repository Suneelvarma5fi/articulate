-- ============================================
-- Articulation Training Platform
-- Database Schema
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
create table users (
  clerk_user_id text primary key,
  created_at timestamptz default now() not null
);

-- ============================================
-- CHALLENGES
-- ============================================
create table challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  reference_image_url text not null,
  categories text[] not null default '{}',
  character_limit integer not null default 150,
  active_date date unique,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'archived')),
  created_at timestamptz default now() not null,
  created_by text references users(clerk_user_id)
);

create index idx_challenges_active_date on challenges(active_date);
create index idx_challenges_status on challenges(status);

-- ============================================
-- ATTEMPTS
-- ============================================
create table attempts (
  id uuid default uuid_generate_v4() primary key,
  clerk_user_id text not null references users(clerk_user_id),
  challenge_id uuid not null references challenges(id),
  articulation_text text not null,
  character_count integer not null,
  quality_level integer not null check (quality_level in (1, 2, 3)),
  credits_spent numeric(4, 1) not null,
  generated_image_url text not null,
  score integer not null check (score >= 0 and score <= 100),
  score_breakdown jsonb,  -- {subject: 0-35, composition: 0-25, color: 0-20, detail: 0-20}
  is_validated boolean not null default true,
  validation_reason text,
  created_at timestamptz default now() not null
);

create index idx_attempts_clerk_user_id on attempts(clerk_user_id);
create index idx_attempts_challenge_id on attempts(challenge_id);
create index idx_attempts_created_at on attempts(created_at);

-- ============================================
-- CREDIT TRANSACTIONS
-- ============================================
create table credit_transactions (
  id uuid default uuid_generate_v4() primary key,
  clerk_user_id text not null references users(clerk_user_id),
  amount numeric(6, 1) not null,
  transaction_type text not null check (transaction_type in ('signup_bonus', 'image_generation', 'purchase')),
  quality_level integer check (quality_level in (1, 2, 3)),
  related_attempt_id uuid references attempts(id),
  stripe_payment_intent_id text,
  created_at timestamptz default now() not null
);

create index idx_credit_transactions_clerk_user_id on credit_transactions(clerk_user_id);
create index idx_credit_transactions_type on credit_transactions(transaction_type);

-- ============================================
-- CHALLENGE SUBMISSIONS
-- ============================================
create table challenge_submissions (
  id uuid default uuid_generate_v4() primary key,
  submitted_by_user_id text not null references users(clerk_user_id),
  reference_image_url text not null,
  title text not null,
  categories text[] not null default '{}',
  character_limit integer not null default 150,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by text references users(clerk_user_id),
  rejection_reason text,
  created_at timestamptz default now() not null
);

create index idx_challenge_submissions_status on challenge_submissions(status);
create index idx_challenge_submissions_user on challenge_submissions(submitted_by_user_id);

-- ============================================
-- HELPER FUNCTION: Get user credit balance
-- ============================================
create or replace function get_credit_balance(user_id text)
returns numeric as $$
  select coalesce(sum(amount), 0)
  from credit_transactions
  where clerk_user_id = user_id;
$$ language sql stable;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Users: users can read their own row
alter table users enable row level security;

create policy "Users can read own data"
  on users for select
  using (clerk_user_id = current_setting('app.current_user', true));

-- Challenges: anyone authenticated can read active challenges
alter table challenges enable row level security;

create policy "Anyone can read active challenges"
  on challenges for select
  using (status in ('active', 'archived'));

-- Attempts: users can read/insert their own attempts
alter table attempts enable row level security;

create policy "Users can read own attempts"
  on attempts for select
  using (clerk_user_id = current_setting('app.current_user', true));

create policy "Users can insert own attempts"
  on attempts for insert
  with check (clerk_user_id = current_setting('app.current_user', true));

-- Credit transactions: users can read their own
alter table credit_transactions enable row level security;

create policy "Users can read own transactions"
  on credit_transactions for select
  using (clerk_user_id = current_setting('app.current_user', true));

-- Challenge submissions: users can read/insert their own
alter table challenge_submissions enable row level security;

create policy "Users can read own submissions"
  on challenge_submissions for select
  using (submitted_by_user_id = current_setting('app.current_user', true));

create policy "Users can insert own submissions"
  on challenge_submissions for insert
  with check (submitted_by_user_id = current_setting('app.current_user', true));

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in the Supabase Dashboard or via API:
--
-- insert into storage.buckets (id, name, public)
-- values ('reference-images', 'reference-images', true);
--
-- insert into storage.buckets (id, name, public)
-- values ('generated-images', 'generated-images', true);
--
-- Storage policies for generated-images:
-- Allow authenticated users to upload to their own folder
-- Allow public read access
