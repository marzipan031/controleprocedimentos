-- Caixa de sugestões — schema para Supabase.
--
-- Rode este arquivo no SQL Editor do seu projeto Supabase
-- (https://app.supabase.com/project/_/sql/new). Precisa já ter rodado
-- schema.sql antes (depende de public.profiles, public.is_admin() e
-- public.is_approved_user() existirem — criados em schema.sql e em
-- procedures_schema.sql).
--
-- Modelo de acesso: qualquer usuário aprovado pode enviar uma sugestão e
-- ver as próprias; só administradores veem/gerenciam as de todo mundo.

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

drop policy if exists "Dono ou admin leem sugestões" on public.suggestions;
create policy "Dono ou admin leem sugestões"
  on public.suggestions for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Aprovados enviam a própria sugestão" on public.suggestions;
create policy "Aprovados enviam a própria sugestão"
  on public.suggestions for insert
  with check (user_id = auth.uid() and public.is_approved_user());

drop policy if exists "Admin atualiza sugestões" on public.suggestions;
create policy "Admin atualiza sugestões"
  on public.suggestions for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin exclui sugestões" on public.suggestions;
create policy "Admin exclui sugestões"
  on public.suggestions for delete
  using (public.is_admin());
