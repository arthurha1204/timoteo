-- Imita o que o Supabase já entrega pronto: papéis, auth.jwt() e permissões padrão.
create role authenticator noinherit login password 'dev';
create role anon nologin noinherit;
create role authenticated nologin noinherit;
grant anon, authenticated to authenticator;

create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.jwt() to anon, authenticated;

grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
