-- Gestão de Procedimentos Médicos — schema de autenticação e aprovação de cadastros.
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (https://app.supabase.com/project/_/sql/new).
--
-- O que ele cria:
--   1. public.profiles         — 1 linha por usuário, com role e status de aprovação
--   2. public.is_admin()       — função auxiliar p/ políticas de RLS sem recursão
--   3. políticas de RLS        — cada usuário só vê/edita o próprio perfil;
--                                 admins veem/editam/excluem todos
--   4. trigger on_auth_user_created — cria a linha em profiles automaticamente
--                                 no cadastro, já aprovando o email do admin

-- 1. Tabela ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2. Função auxiliar -----------------------------------------------------
-- security definer + search_path fixo evita que uma política de SELECT em
-- profiles chame a si mesma indiretamente (recursão infinita de RLS).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Políticas de RLS -----------------------------------------------------

drop policy if exists "Usuários leem o próprio perfil" on public.profiles;
create policy "Usuários leem o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins leem todos os perfis" on public.profiles;
create policy "Admins leem todos os perfis"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins atualizam perfis" on public.profiles;
create policy "Admins atualizam perfis"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "Admins excluem perfis" on public.profiles;
create policy "Admins excluem perfis"
  on public.profiles for delete
  using (public.is_admin());

-- 4. Criação automática de perfil no cadastro -----------------------------
-- Troque o email abaixo se o admin da sua instalação for outra pessoa.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (
    new.id,
    new.email,
    case when new.email = 'eduardoseubert@gmail.com' then 'admin' else 'user' end,
    case when new.email = 'eduardoseubert@gmail.com' then 'approved' else 'pending' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fim. Depois de rodar este script:
--   • Authentication → Providers → Email → desligue "Confirm email"
--     (a aprovação do admin já serve como o gate de acesso; deixar as duas
--     checagens ligadas obriga o usuário a confirmar email E esperar
--     aprovação, o que costuma confundir).
--   • Authentication → URL Configuration → Redirect URLs → adicione
--     a URL de produção + /redefinir-senha (e http://localhost:5173/redefinir-senha
--     para desenvolvimento).
--   • Se eduardoseubert@gmail.com já tiver se cadastrado antes de rodar este
--     script, rode manualmente:
--       update public.profiles set role = 'admin', status = 'approved'
--       where email = 'eduardoseubert@gmail.com';
