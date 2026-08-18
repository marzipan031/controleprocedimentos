# Gestão de Exames Médicos

Registro e métricas de exames endoscópicos, com painel principal, estatísticas
com gráficos, e (opcionalmente) login com aprovação de cadastro por um admin.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (Radix) + recharts +
xlsx + sonner. Autenticação e aprovação de cadastros via Supabase.

## Rodando localmente

```bash
npm install
npm run dev
```

Sem nenhuma configuração adicional, o app roda direto: registro de exames,
métricas, filtros, CSV e importação de planilha funcionam 100% no navegador
(dados em LocalStorage). As telas de login/cadastro/admin só entram em ação
quando o Supabase estiver configurado (veja abaixo) — até lá elas mostram um
aviso de "não configurado" e o resto do app funciona normalmente, sem tela de
login.

## Configurando o Supabase (login, cadastro, aprovação de admin)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de `supabase/schema.sql` — ele
   cria a tabela `profiles`, as políticas de RLS e o gatilho que cria um
   perfil automaticamente a cada cadastro (aprovando de cara o email definido
   como admin ali dentro).
3. Em **Authentication → Providers → Email**, desligue "Confirm email" (a
   aprovação do admin já serve como o gate de acesso).
4. Em **Authentication → URL Configuration → Redirect URLs**, adicione
   `http://localhost:5173/redefinir-senha` (dev) e a URL de produção +
   `/redefinir-senha` depois do deploy.
5. Copie `.env.example` para `.env.local` e preencha com a URL e a chave
   `anon` do projeto (**Project Settings → API**).
6. (Opcional, para o botão "Excluir" na página Cadastros remover a conta de
   login por completo, não só o cadastro) implante a Edge Function:
   ```bash
   supabase functions deploy delete-user
   ```
   Sem isso, "Excluir" ainda remove a linha de `profiles`, só não apaga o
   usuário do Supabase Auth.

O email definido como admin em `supabase/schema.sql` (procure por
`eduardoseubert@gmail.com`) é aprovado automaticamente no cadastro e ganha
acesso à página **Cadastros** (link no cabeçalho, ao lado de Estatísticas),
onde dá para aprovar, rejeitar ou excluir os demais cadastros.

## Deploy

Build estático padrão:

```bash
npm run build   # gera dist/
```

`vercel.json` e `public/_redirects` já estão no repo com o rewrite de SPA
(qualquer rota → `index.html`) necessário para o React Router funcionar em
produção — funcionam tanto na Vercel quanto em serviços que leem
`_redirects` (Netlify, Cloudflare Pages). Escolha a hospedagem, aponte para
este repo, comando de build `npm run build`, diretório de saída `dist`, e
defina `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` nas variáveis de
ambiente do serviço (mesmos valores do `.env.local`).
