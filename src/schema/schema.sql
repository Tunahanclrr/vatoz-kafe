-- =====================================================================
-- Vatoz Kafe — Sadakat & Sipariş Sistemi — Supabase şeması
--
-- NASIL ÇALIŞTIRILIR:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Bu dosyanın tamamını yapıştırıp "Run" ile çalıştırın.
--   3. Admin hesabı oluşturmak için:
--      a) Authentication → Users → Add user ile bir kullanıcı oluşturun
--         (email + şifre belirleyin, "Auto Confirm User" işaretli olsun).
--      b) O kullanıcının UUID'sini kopyalayıp aşağıdaki gibi çalıştırın:
--         insert into public.admins (id, full_name, email)
--         values ('<KULLANICI-UUID>', 'Admin Adı', 'admin@ornek.com');
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABLOLAR
-- ---------------------------------------------------------------------

create table public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null unique,
  email text not null unique,
  vibe_points integer not null default 0 check (vibe_points >= 0),
  created_at timestamptz not null default now()
);

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  vibe_points integer not null default 0 check (vibe_points >= 0),
  category text not null default 'Kahve',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  required_points integer not null check (required_points > 0),
  reward_product_id uuid references public.products(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  total_price numeric(10, 2) not null default 0 check (total_price >= 0),
  total_vibe_points integer not null default 0 check (total_vibe_points >= 0),
  total_points_redeemed integer not null default 0 check (total_points_redeemed >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Aynı anda sadece bir "pending" sipariş, aynı anda sadece bir müşteri başına bir "pending" sipariş.
create unique index orders_pending_code_key on public.orders (order_code) where (status = 'pending');
create unique index orders_pending_customer_key on public.orders (customer_id) where (status = 'pending');

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0),
  unit_vibe_points integer not null default 0 check (unit_vibe_points >= 0),
  is_reward boolean not null default false,
  reward_id uuid references public.rewards(id)
);

-- ---------------------------------------------------------------------
-- YARDIMCI FONKSİYON: is_admin
-- ---------------------------------------------------------------------

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.id = uid);
$$;

-- ---------------------------------------------------------------------
-- YENİ KULLANICI → customers SATIRI (trigger)
-- ---------------------------------------------------------------------

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sadece normal müşteri kaydında (signUp options.data içinde 'phone' gönderilir) satır oluştur.
  -- Admin hesapları seed_admin.sql ile 'phone' göndermeden oluşturulur, bu yüzden customers'a düşmezler.
  if new.raw_user_meta_data ? 'phone' then
    insert into public.customers (id, full_name, phone, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      new.raw_user_meta_data->>'phone',
      new.email
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_customer();

-- ---------------------------------------------------------------------
-- KAYIT ÖNCESİ MÜSAİTLİK KONTROLÜ
-- ---------------------------------------------------------------------

create or replace function public.check_availability(p_phone text, p_email text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'phone_taken', exists (select 1 from public.customers c where c.phone = p_phone),
    'email_taken', exists (select 1 from public.customers c where c.email = p_email)
  );
$$;

grant execute on function public.check_availability(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- TELEFONDAN E-POSTA ÇÖZÜMLEME (login için)
-- ---------------------------------------------------------------------

create or replace function public.get_email_by_phone(p_phone text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select c.email from public.customers c where c.phone = p_phone limit 1;
$$;

grant execute on function public.get_email_by_phone(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- SİPARİŞ OLUŞTURMA
--
-- p_items formatı (jsonb array):
--   Ürün satırı:  {"product_id": "<uuid>", "quantity": 2}
--   Ödül satırı:  {"reward_id":  "<uuid>", "quantity": 1}
-- ---------------------------------------------------------------------

create or replace function public.create_order(p_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := auth.uid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_reward public.rewards%rowtype;
  v_quantity integer;
  v_total_price numeric(10,2) := 0;
  v_total_points integer := 0;
  v_total_redeemed integer := 0;
  v_customer_points integer;
  v_code text;
  v_order public.orders%rowtype;
  v_attempt integer := 0;
begin
  if v_customer_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select vibe_points into v_customer_points from public.customers where id = v_customer_id;
  if v_customer_points is null then
    raise exception 'CUSTOMER_NOT_FOUND';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  -- Aktif bekleyen sipariş var mı? (partial unique index de bunu garanti eder, burada anlamlı hata mesajı için önden kontrol)
  if exists (select 1 from public.orders where customer_id = v_customer_id and status = 'pending') then
    raise exception 'PENDING_ORDER_EXISTS';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::integer, 1);
    if v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;

    if v_item ? 'reward_id' then
      select * into v_reward from public.rewards where id = (v_item->>'reward_id')::uuid and is_active = true;
      if not found then
        raise exception 'REWARD_NOT_FOUND';
      end if;
      v_total_redeemed := v_total_redeemed + v_reward.required_points * v_quantity;
    else
      select * into v_product from public.products where id = (v_item->>'product_id')::uuid and is_active = true;
      if not found then
        raise exception 'PRODUCT_NOT_FOUND';
      end if;
      v_total_price := v_total_price + v_product.price * v_quantity;
      v_total_points := v_total_points + v_product.vibe_points * v_quantity;
    end if;
  end loop;

  if v_total_redeemed > v_customer_points then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 30 then
      raise exception 'CODE_GENERATION_FAILED';
    end if;
    v_code := lpad(floor(random() * 9000 + 1000)::text, 4, '0');
    exit when not exists (select 1 from public.orders where order_code = v_code and status = 'pending');
  end loop;

  insert into public.orders (order_code, customer_id, status, total_price, total_vibe_points, total_points_redeemed)
  values (v_code, v_customer_id, 'pending', v_total_price, v_total_points, v_total_redeemed)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::integer, 1);
    if v_item ? 'reward_id' then
      select * into v_reward from public.rewards where id = (v_item->>'reward_id')::uuid;
      insert into public.order_items (order_id, product_id, quantity, unit_price, unit_vibe_points, is_reward, reward_id)
      values (v_order.id, v_reward.reward_product_id, v_quantity, 0, 0, true, v_reward.id);
    else
      select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
      insert into public.order_items (order_id, product_id, quantity, unit_price, unit_vibe_points, is_reward, reward_id)
      values (v_order.id, v_product.id, v_quantity, v_product.price, v_product.vibe_points, false, null);
    end if;
  end loop;

  return v_order;
end;
$$;

grant execute on function public.create_order(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- ADMIN: SİPARİŞ ONAYLAMA (puanları işler)
-- ---------------------------------------------------------------------

create or replace function public.admin_complete_order(p_order_code text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_customer_points integer;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select * into v_order from public.orders where order_code = p_order_code and status = 'pending' for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  select vibe_points into v_customer_points from public.customers where id = v_order.customer_id for update;
  if v_customer_points < v_order.total_points_redeemed then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  update public.customers
    set vibe_points = vibe_points - v_order.total_points_redeemed + v_order.total_vibe_points
    where id = v_order.customer_id;

  update public.orders
    set status = 'completed', completed_at = now()
    where id = v_order.id
    returning * into v_order;

  return v_order;
end;
$$;

grant execute on function public.admin_complete_order(text) to authenticated;

-- ---------------------------------------------------------------------
-- ADMIN: SİPARİŞ İPTALİ
-- ---------------------------------------------------------------------

create or replace function public.admin_cancel_order(p_order_code text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  update public.orders
    set status = 'cancelled'
    where order_code = p_order_code and status = 'pending'
    returning * into v_order;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  return v_order;
end;
$$;

grant execute on function public.admin_cancel_order(text) to authenticated;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.rewards enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- customers: sadece kendi profilini (veya admin herkesi) okuyabilir. Yazma yok (trigger + RPC'ler halleder).
create policy customers_select on public.customers
  for select using (auth.uid() = id or public.is_admin());

-- admins: client'tan hiçbir doğrudan erişim yok (is_admin() SECURITY DEFINER ile okur).

-- products: aktif ürünler herkese açık, admin hepsini görür/yazar.
create policy products_select on public.products
  for select using (is_active = true or public.is_admin());
create policy products_write on public.products
  for insert with check (public.is_admin());
create policy products_update on public.products
  for update using (public.is_admin()) with check (public.is_admin());
create policy products_delete on public.products
  for delete using (public.is_admin());

-- rewards: aktif ödüller herkese açık, admin hepsini görür/yazar.
create policy rewards_select on public.rewards
  for select using (is_active = true or public.is_admin());
create policy rewards_write on public.rewards
  for insert with check (public.is_admin());
create policy rewards_update on public.rewards
  for update using (public.is_admin()) with check (public.is_admin());
create policy rewards_delete on public.rewards
  for delete using (public.is_admin());

-- orders: müşteri kendi siparişlerini, admin hepsini görür. Yazma yok (RPC'ler halleder).
create policy orders_select on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());

-- order_items: bağlı olduğu order'ı görebilen görebilir.
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------
-- REALTIME
--
-- Admin sipariş paneli (bekleyen siparişler) ve müşteri tarafı (puan bakiyesi,
-- sipariş durumu) canlı güncellensin diye orders/customers tablolarını
-- supabase_realtime publication'ına ekle. (Zaten ekliyse hata vermeden geçer.)
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'customers'
  ) then
    alter publication supabase_realtime add table public.customers;
  end if;
end $$;

-- orders için "eski durum pending miydi" karşılaştırması yapılabilsin diye (client tarafında
-- pending -> completed geçişini yakalayıp "siparişiniz onaylandı" bildirimi göstermek için)
-- UPDATE olaylarında tüm eski satır gönderilsin:
alter table public.orders replica identity full;
