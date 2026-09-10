-- Adiciona o campo opcional de laudo anatomopatológico aos procedimentos.
--
-- Rode este arquivo no SQL Editor do seu projeto Supabase
-- (https://app.supabase.com/project/_/sql/new). Precisa já ter rodado
-- procedures_schema.sql antes (esse arquivo só adiciona uma coluna na
-- tabela public.procedures que já existe).

alter table public.procedures
  add column if not exists pathology_report text;

comment on column public.procedures.pathology_report is
  'Laudo do anatomopatológico. Nulo/vazio quando o campo está desligado no formulário.';
