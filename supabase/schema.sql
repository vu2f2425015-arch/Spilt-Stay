-- SplitStay Supabase Database Schema
-- Run this script in your Supabase SQL Editor (https://app.supabase.com -> SQL Editor)

-- 1. Create or Update Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone_number TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create or Update Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  join_code TEXT UNIQUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TEXT DEFAULT 'Just created'
);

ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS join_code TEXT;
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(UPPER(join_code));

-- 3. Create Group Members Table (Connects users by Email)
CREATE TABLE IF NOT EXISTS public.group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id TEXT,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  balance NUMERIC DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing columns are added if group_members table already existed in your database
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0.00;

-- Create Indexes for fast lookup by Email ID and Group ID
CREATE INDEX IF NOT EXISTS idx_group_members_email ON public.group_members(email);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);

-- 4. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT DEFAULT 'General',
  date TEXT NOT NULL,
  payer_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Expense Splits Table
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL
);

-- 6. Create Settlements Table
CREATE TABLE IF NOT EXISTS public.settlements (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  payer_id TEXT NOT NULL,
  payee_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Row Level Security (RLS) & Public Policies for App Access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public Write Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Groups" ON public.groups;
DROP POLICY IF EXISTS "Public Write Groups" ON public.groups;
DROP POLICY IF EXISTS "Public Read Group Members" ON public.group_members;
DROP POLICY IF EXISTS "Public Write Group Members" ON public.group_members;
DROP POLICY IF EXISTS "Public Read Expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public Write Expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public Read Expense Splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Public Read Settlements" ON public.settlements;
DROP POLICY IF EXISTS "Public Write Settlements" ON public.settlements;

CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Write Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Read Groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Public Write Groups" ON public.groups FOR ALL USING (true);
CREATE POLICY "Public Read Group Members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Public Write Group Members" ON public.group_members FOR ALL USING (true);
CREATE POLICY "Public Read Expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public Write Expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Public Read Expense Splits" ON public.expense_splits FOR SELECT USING (true);
CREATE POLICY "Public Read Settlements" ON public.settlements FOR SELECT USING (true);
CREATE POLICY "Public Write Settlements" ON public.settlements FOR ALL USING (true);
