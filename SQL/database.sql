-- Habilitar extensões necessárias (já vêm na maioria dos projetos)
create extension if not exists pgcrypto;

-- Tabela de perfis de usuário (complementa auth.users)
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(), -- chave primária local
  auth_id uuid not null references auth.users(id) on delete cascade, -- linka com auth
  name text not null,
  cpf varchar(14) unique not null,   -- 000.000.000-00
  ra varchar(20) unique not null,    -- Registro do aluno
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Atualiza automaticamente o campo updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on public.user_profiles
for each row
execute function update_updated_at_column();

-- Segurança: habilitar Row Level Security
alter table public.user_profiles enable row level security;

-- Políticas: cada usuário só pode ver/editar o próprio perfil
create policy "Users can view own profile"
on public.user_profiles for select
using ( auth.uid() = auth_id );

create policy "Users can insert own profile"
on public.user_profiles for insert
with check ( auth.uid() = auth_id );

create policy "Users can update own profile"
on public.user_profiles for update
using ( auth.uid() = auth_id );

create policy "Users can delete own profile"
on public.user_profiles for delete
using ( auth.uid() = auth_id );
