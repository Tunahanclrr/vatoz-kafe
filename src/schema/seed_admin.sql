-- =====================================================================
-- Vatoz Kafe — Hazır admin hesabı oluşturma
--
-- Bu betik, Supabase Dashboard'a girmeden SQL Editor üzerinden
-- doğrudan çalışan bir admin hesabı (auth.users + admins satırı) oluşturur.
--
-- NASIL KULLANILIR:
--   1. Aşağıda v_email ve v_password değerlerini kendi bilgilerinle değiştir.
--   2. schema.sql zaten çalıştırılmış olmalı (admins tablosu mevcut olmalı).
--   3. Bu dosyanın tamamını Supabase Dashboard → SQL Editor'de çalıştır.
--   4. Çalıştırdıktan sonra /admin sayfasından bu email + şifre ile giriş yapabilirsin.
--
-- NOT: Aynı e-posta ile tekrar çalıştırırsan "duplicate key" hatası alırsın —
-- bu normaldir, hesap zaten oluşmuş demektir. Farklı bir admin daha eklemek
-- istersen v_email/v_password'ü değiştirip tekrar çalıştır.
-- =====================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_user_id uuid := gen_random_uuid();
  v_email text := 'admin@vatozkafe.com';       -- <-- BURAYI DEĞİŞTİR
  v_password text := 'VatozAdmin2024!';        -- <-- BURAYI DEĞİŞTİR
  v_full_name text := 'Vatoz Admin';           -- <-- İSTERSEN DEĞİŞTİR
begin
  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'Bu e-posta ile zaten bir kullanıcı var: %', v_email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', v_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  );

  -- raw_user_meta_data içinde 'phone' olmadığı için handle_new_customer trigger'ı
  -- bu kullanıcı için customers satırı OLUŞTURMAZ (bkz. schema.sql) — admin yetkisi sadece bu satırla verilir:
  insert into public.admins (id, full_name, email)
  values (v_user_id, v_full_name, v_email);

  raise notice 'Admin oluşturuldu: % / %', v_email, v_password;
end $$;
