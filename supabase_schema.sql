-- Chạy đoạn mã SQL này trong phần SQL Editor của Supabase để tạo bảng User và tự động đồng bộ khi có người Login bằng Google

-- 1. Tạo bảng users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  userName TEXT,
  email TEXT,
  password TEXT, -- Supabase tự động quản lý mật khẩu mã hóa bên bảng auth.users, cột này tạo theo yêu cầu nhưng thường ít dùng
  googleId TEXT,
  role TEXT DEFAULT 'user',
  isPremium BOOLEAN DEFAULT false,
  avatarUrl TEXT
);

-- 2. Bật Row Level Security (RLS) để bảo mật
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING ( true );
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING ( auth.uid() = id );

-- 3. Tạo function tự động thêm user vào bảng public.users khi có đăng nhập từ Google (bảng auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, userName, avatarUrl, googleId)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'provider_id'
  );
  return new;
end;
$$;

-- 4. Gắn trigger vào bảng auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 5. LUU �: Ch?y do?n m� n�y d? �?NG B? C�C T�I KHO?N �� �ANG NH?P TRU?C �� (tru?c khi t?o b?ng/trigger)
INSERT INTO public.users (id, email, username, avatarurl, googleid)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  raw_user_meta_data->>'provider_id'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
