# Comedoria da Tia — Sistema Web (Admin)

Plataforma web para **gestão de produtos, estoque, cardápio, pedidos, usuários do app mobile, envios de notificações (push) e relatórios**.
Construído em **React + Vite** com integração ao **Supabase**.

> Repositório do app mobile (Kotlin/Java) e demais serviços podem ser mantidos em projetos separados. Este repositório cobre o **painel administrativo web**.

---

## ✨ Principais Recursos

* **Catálogo & Produtos**

  * CRUD de produtos, categorias e variações (tamanhos/sabores).
  * Preço, custo, margem, status (ativo/inativo), foto e tags.
* **Estoque**

  * Controle por **movimentações** (entrada/saída/ajuste).
  * Alertas de **estoque mínimo** e sugestão de compra.
  * Kardex por produto (histórico filtrável).
* **Cardápio do Dia**

  * Montagem rápida do menu exibido no app dos clientes.
* **Pedidos (opcional)**

  * Visualização e atualização de status (recebido, em preparo, pronto, entregue/cancelado).
* **Usuários & Perfis**

  * Integração com **Supabase Auth** (funcionários/admin).
  * Papéis: `admin`, `gerente`, `atendente`.
* **Notificações**

  * Envio de **push** para o app mobile via tokens de dispositivos.
  * Segmentação por curso/turma, grupo, ou todos.
* **Relatórios**

  * Vendas por período, produtos mais vendidos, giro de estoque.
* **Configurações**

  * Logo, horários, pontos de retirada, regras de promoções.
* **LGPD & Segurança**

  * Políticas de acesso (RLS), logs de auditoria e gestão de consentimento.

---

## 🧱 Stack Técnica

* **Frontend:** React 18 + Vite, React Router, Zustand/Context, **Tailwind CSS** (ou CSS Modules), Radix/shadcn-ui (opcional).
* **Backend-as-a-Service:** **Supabase**

  * Postgres + **Row-Level Security**
  * Auth (email/senha, magic link)
  * Storage (imagens)
  * Edge Functions (ex.: ponte para FCM)
* **Notificações Push:** Firebase Cloud Messaging (FCM) – tokens salvos no Postgres.
* **Qualidade:** ESLint, Prettier, TypeScript (opcional), Husky + lint-staged (opcional).
* **Deploy:** Vercel (frontend) + Supabase (DB, Auth, Functions).

---

## 🚀 Começando

### Pré-requisitos

* **Node.js** ≥ 18
* **npm** (recomendado) ou npm/yarn
* Conta no **Supabase** e projeto criado
* Projeto **Firebase** (para FCM) se for usar push

### Clonar & Instalar

```bash
git clone https://github.com/<org>/<comedoria_da_tia_web>.git
cd <comedoria_da_tia_web>
npm install
```

### Variáveis de Ambiente

Crie um `.env` na raiz:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
# Opcional: Storage público para imagens
VITE_PRODUCT_IMAGES_BUCKET=products

# Notificações (FCM) — via Edge Function
# Use HTTP v1 com Service Account (recomendado)
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-projeto.iam.gserviceaccount.com
# Atenção às quebras de linha do PRIVATE KEY
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Segurança
VITE_APP_ENV=development
```

> Em produção, **NÃO** exponha `FIREBASE_PRIVATE_KEY` no frontend.
> Guarde segredos em **Supabase Secrets** (Edge Functions) e use apenas `VITE_*` para valores públicos.

### Rodar em Dev

```bash
npm dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

### Build & Preview

```bash
npm build
npm preview
```

---

## 🗂️ Estrutura de Pastas (sugerida)

```
.
├─ public/                 # ícones, manifest, favicon
├─ src/
│  ├─ app/                 # rotas (React Router)
│  ├─ components/          # UI compartilhada
│  ├─ features/
│  │  ├─ products/         # páginas/serviços de produtos
│  │  ├─ inventory/        # movimentações, dashboards
│  │  ├─ menu/             # cardápio do dia
│  │  ├─ orders/           # pedidos
│  │  ├─ users/            # gestão de usuários/roles
│  │  └─ notifications/    # envio/filas de push
│  ├─ hooks/
│  ├─ lib/
│  │  ├─ supabaseClient.ts
│  │  └─ fetcher.ts
│  ├─ styles/
│  ├─ types/
│  └─ main.tsx
├─ supabase/
│  ├─ migrations/          # SQL versionado
│  └─ functions/           # edge functions (ex.: send-push)
├─ .eslintrc.cjs
├─ .prettierrc
├─ README.md
└─ package.json
```

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas-chave (resumo)

* `products` — id, name, description, price, cost, sku, barcode, photo\_url, category\_id, is\_active
* `categories` — id, name
* `inventory_movements` — id, product\_id, type (`in`, `out`, `adjust`), qty, unit\_cost, note, created\_by
* `inventory_snapshot` (opcional) — produto x saldo agregado por dia/turno
* `menu_items` — id, product\_id, date, note, is\_featured
* `orders` (opcional) — id, user\_id, total, status, items (jsonb)
* `device_tokens` — id, user\_id, platform, token, last\_seen
* `app_settings` — chave/valor para flags do app
* `users_app` — perfil estendido (papel, curso, semestre etc.)

### Exemplo de Migração (trecho)

> Coloque o SQL completo em `supabase/migrations/2025-xx-xx-init.sql`.

```sql
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  cost numeric(12,2) default 0,
  sku text unique,
  barcode text unique,
  photo_url text,
  category_id uuid references public.categories(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('in','out','adjust')),
  qty integer not null,
  unit_cost numeric(12,2),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text check (platform in ('android','ios','web')),
  token text not null unique,
  last_seen timestamptz default now()
);
```

### RLS (Row-Level Security)

* Ative RLS nas tabelas sensíveis.
* Crie um papel lógico `is_admin()` e use policies.

```sql
-- Exemplo de helper para admins
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.users_app u
    where u.id = uid and u.role in ('admin','gerente')
  );
$$;

-- Ex.: products visível para todos logados (leitura)
alter table public.products enable row level security;

create policy "read products"
on public.products for select
to authenticated
using (true);

-- Escrita apenas admins/gerentes
create policy "write products"
on public.products for all
to authenticated
using ( public.is_admin(auth.uid()) )
with check ( public.is_admin(auth.uid()) );
```

> Ajuste as policies conforme a necessidade (por exemplo, `inventory_movements` apenas para admin/gerente).

---

## 🔔 Notificações Push (Visão Geral)

1. O **app mobile** registra o token FCM e envia para a API (salva em `device_tokens`).
2. No painel web, o admin cria uma campanha (título, corpo, filtro/segmento).
3. Uma **Edge Function** do Supabase (`send-push`) recebe a solicitação, autentica e reencaminha ao **FCM HTTP v1**.

### Estrutura da Function (resumo Deno)

`supabase/functions/send-push/index.ts`:

```ts
// Pseudocódigo — implemente com OAuth do FCM HTTP v1
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  // 1) validar auth (service role) e payload
  // 2) consultar tokens no Postgres (por filtro)
  // 3) obter access token do Google com service account
  // 4) POST em https://fcm.googleapis.com/v1/projects/<PROJECT_ID>/messages:send
  // 5) retornar status e ids
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" }});
});
```

> Armazene `FIREBASE_*` como **Secrets** da Function (não expor no frontend).
> Registre tokens do app em `device_tokens`.

---

## 🧩 Integrações do Frontend

* `src/lib/supabaseClient.ts`: instancia do Supabase
* `src/features/products/api.ts`: CRUD de produtos
* `src/features/inventory/api.ts`: movimentações
* `src/features/notifications/api.ts`: chamada para Edge Function `send-push`

---

## 🧪 Testes (opcional)

* Unitários com Vitest.
* E2E com Playwright/Cypress (ex.: fluxo de login, CRUD de produto, envio de notificação).

---

## 🧰 Scripts

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint \"src/**/*.{ts,tsx,js,jsx}\"",
    "format": "prettier --write .",
    "test": "vitest"
  }
}
```

---

## 🎨 UI/UX (recomendações)

* Design responsivo mobile-first (painel utilizável em tablets).
* Componentes acessíveis (atalhos de teclado, foco visível).
* Tabelas com busca, filtros e exportação CSV.
* Dashboard com **cards de estoque crítico**, vendas e top produtos.

---

## 🔐 Segurança & LGPD

* **RLS** + policies revisadas.
* **Logs** de auditoria para ações críticas (ex.: ajuste de estoque).
* **Consentimento** e aviso de privacidade no app cliente.
* GDPR/LGPD: minimização de dados pessoais; retenção e direito de exclusão.

---

## 🚢 Deploy

* **Frontend:** Vercel → defina `VITE_*` em **Environment Variables**.
* **Supabase:** Migrações em `supabase/migrations`.
  Edge Functions: `supabase functions deploy send-push`
* **Domínio:** configure HTTPS e redirecionamentos (www → raiz).

---

## 🧭 Roadmap (sugestão)

* [ ] Promoções e cupons
* [ ] Impressão de pedidos/cozinha
* [ ] Múltiplas lojas/pontos de venda
* [ ] Relatório de CMV e margem por período
* [ ] Integração de pagamentos (Pix/Link)
* [ ] Multi-idioma (pt-BR/en)

---

## 👥 Equipe / Créditos

**CT Dev’s — Comedoria da Tia**

* Breno Costa Nascimento — GitHub: `brenocosta19` — LinkedIn: /in/breno-costa-28a401264/
* Bruno Souza Lima — GitHub: `BrunoSouza06` — LinkedIn: /in/bruno-souza-lima-448850263/
* Felipe Toshio Yamaschita — GitHub: `Yamaschita` — LinkedIn: /in/felipe-yamaschita-96232b329/
* Vinícius Nishimura Reis — GitHub: `Vinishireis` — LinkedIn: /in/vinicius-nishimura-reis/
* Nicolly Silva Soares — GitHub: `nicollysoarez` — LinkedIn: /in/nicolly-silva-soares-10b627171/

> Atualize os perfis conforme necessário.

## 📌 Anexos Úteis

* Checklist de publicação

  * [ ] Variáveis de ambiente preenchidas
  * [ ] Buckets de imagens criados (`products`)
  * [ ] Policies RLS auditadas
  * [ ] Tokens FCM salvos e testados
  * [ ] Páginas 404/500 personalizadas
* Scripts úteis

  * Semente inicial de categorias/produtos (coloque em `supabase/seed/seed.sql`)
  * Rotina de **estoque mínimo** (Edge Function + cron do Supabase)