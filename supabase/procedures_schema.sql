-- Dados de procedimentos — schema para Supabase (nuvem).
--
-- Substitui o armazenamento local do navegador (localStorage) por dados
-- compartilhados na nuvem, protegidos por login.
--
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (https://app.supabase.com/project/_/sql/new). Precisa já ter rodado
-- schema.sql antes (esse arquivo depende de public.profiles e de
-- public.is_admin() existirem).
--
-- Modelo de acesso (dados de paciente são sensíveis — LGPD):
--   • public.procedures (os registros de pacientes em si): cada usuário só
--     lê/edita/exclui os PRÓPRIOS registros. Administradores veem todos,
--     para aprovação/estatísticas gerais da equipe.
--   • Tipos de procedimento, chefes, combinações de cards e contagens
--     históricas NÃO identificam paciente nenhum — são configuração
--     compartilhada da equipe (para o formulário e os cards ficarem
--     iguais para todo mundo), então continuam visíveis para qualquer
--     usuário aprovado.

-- 1. Tabelas -----------------------------------------------------------

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  patient text not null,
  date date not null,
  type text not null default '',
  types text[] not null default '{}',
  encounter_number text,
  chief text not null default '',
  observation text not null default '',
  findings text not null default '',
  biopsy boolean not null default false,
  interesting boolean not null default false,
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.procedure_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.chiefs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.historical_counts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  value integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.combo_cards (
  id uuid primary key default gen_random_uuid(),
  types text[] not null,
  created_at timestamptz not null default now()
);

alter table public.procedures enable row level security;
alter table public.procedure_types enable row level security;
alter table public.chiefs enable row level security;
alter table public.historical_counts enable row level security;
alter table public.combo_cards enable row level security;

-- 2. Função auxiliar -----------------------------------------------------
-- Precisa existir ANTES das políticas abaixo, que a usam.

create or replace function public.is_approved_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

-- 3. Políticas de RLS — public.procedures (dado sensível de paciente) -----
-- Cada usuário só acessa o que criou; admin acessa tudo.

drop policy if exists "Dono ou admin leem procedures" on public.procedures;
create policy "Dono ou admin leem procedures"
  on public.procedures for select
  using (created_by = auth.uid() or public.is_admin());

drop policy if exists "Aprovados inserem os próprios procedures" on public.procedures;
create policy "Aprovados inserem os próprios procedures"
  on public.procedures for insert
  with check (created_by = auth.uid() and public.is_approved_user());

drop policy if exists "Dono ou admin atualizam procedures" on public.procedures;
create policy "Dono ou admin atualizam procedures"
  on public.procedures for update
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "Dono ou admin excluem procedures" on public.procedures;
create policy "Dono ou admin excluem procedures"
  on public.procedures for delete
  using (created_by = auth.uid() or public.is_admin());

-- 4. Políticas de RLS — configuração compartilhada da equipe -------------
-- Tipos, chefes, combinações e contagens históricas não identificam
-- paciente: qualquer usuário aprovado lê e edita, para ficarem iguais
-- para todo mundo (o formulário, os cards, etc.).

do $$
declare
  t text;
begin
  foreach t in array array['procedure_types', 'chiefs', 'historical_counts', 'combo_cards']
  loop
    execute format('drop policy if exists "Aprovados leem %1$s" on public.%1$I', t, t);
    execute format('create policy "Aprovados leem %1$s" on public.%1$I for select using (public.is_approved_user())', t, t);

    execute format('drop policy if exists "Aprovados inserem %1$s" on public.%1$I', t, t);
    execute format('create policy "Aprovados inserem %1$s" on public.%1$I for insert with check (public.is_approved_user())', t, t);

    execute format('drop policy if exists "Aprovados atualizam %1$s" on public.%1$I', t, t);
    execute format('create policy "Aprovados atualizam %1$s" on public.%1$I for update using (public.is_approved_user())', t, t);

    execute format('drop policy if exists "Aprovados excluem %1$s" on public.%1$I', t, t);
    execute format('create policy "Aprovados excluem %1$s" on public.%1$I for delete using (public.is_approved_user())', t, t);
  end loop;
end $$;

-- Fim. Depois de rodar este script, o app passa a ler/gravar os
-- procedimentos aqui em vez de no navegador. Dados que já existiam só no
-- localStorage de cada computador não migram sozinhos — o app mostra um
-- aviso para importar os dados daquele navegador na primeira vez que
-- alguém abrir a página com a nuvem configurada, e cada um só importa (e
-- só volta a ver) os próprios registros.
