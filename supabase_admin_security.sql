-- ==============================================================================
-- BẢO MẬT VÀ PHÂN QUYỀN ADMIN CHO BẢNG USERS TRÊN SUPABASE (BẢN SỬA LỖI ĐỆ QUY RLS)
-- Sao chép toàn bộ mã này và dán vào SQL Editor của Supabase rồi bấm RUN.
-- ==============================================================================

-- 1. CẤP QUYỀN TRUY CẬP CƠ BẢN CHO ROLE AUTHENTICATED VÀ ANON
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- 2. BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. XÓA CÁC POLICY CŨ ĐỂ TRÁNH XUNG ĐỘT
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Admins have full access." ON public.users;
DROP POLICY IF EXISTS "Users can read own profile or admin reads all" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile, Admins can update any" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;

-- 4. HÀM KIỂM TRA ADMIN CHUẨN (DÙNG LANGUAGE SQL + SECURITY DEFINER ĐỂ TRÁNH ĐỆ QUY)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.users WHERE id = (SELECT auth.uid())),
    false
  );
$$;

-- 5. POLICY ĐỌC (SELECT):
-- User thường chỉ đọc được thông tin của mình (auth.uid() = id).
-- Admin đọc được toàn bộ danh sách tất cả người dùng (public.is_admin()).
CREATE POLICY "Allow authenticated read users"
ON public.users
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR public.is_admin()
);

-- 6. HÀM RPC ĐẶC QUYỀN DÀNH CHO ADMIN LẤY TOÀN BỘ USERS (AN TOÀN TUYỆT ĐỐI)
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Chỉ duy nhất Admin mới được phép gọi hàm này
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên (Admin) mới có quyền truy cập!';
  END IF;

  RETURN QUERY 
  SELECT * FROM public.users;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;

-- 7. POLICY THÊM MỚI (INSERT):
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

-- 8. TRIGGER NGĂN CHẶN NÂNG QUYỀN TRÁI PHÉP (Chặn user tự sửa role = 'admin'):
CREATE OR REPLACE FUNCTION public.check_user_update_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu có sự thay đổi giá trị cột role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Nếu người gọi không phải là Admin hiện tại, hủy transaction
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên (Admin) mới có quyền thay đổi vai trò tài khoản!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trigger_check_role_escalation ON public.users;
CREATE TRIGGER trigger_check_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_update_privileges();

-- 9. POLICY CẬP NHẬT (UPDATE):
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile, Admins can update any" ON public.users;
DROP POLICY IF EXISTS "Admins can update any profile or user update own" ON public.users;

CREATE POLICY "Admins can update any profile or user update own"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR public.is_admin()
)
WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

-- 10. POLICY XOÁ (DELETE):
DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;

CREATE POLICY "Only admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- 11. HÀM RPC ĐỔI VAI TRÒ DÀNH CHO ADMIN (AN TOÀN TUYỆT ĐỐI)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id text, p_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền thay đổi vai trò!';
  END IF;

  UPDATE public.users
  SET role = p_role
  WHERE id::text = p_user_id::text;

  RETURN true;
END;
$$;

-- 12. HÀM RPC ĐỔI GÓI PREMIUM DÀNH CHO ADMIN
CREATE OR REPLACE FUNCTION public.admin_update_user_premium(p_user_id text, p_is_premium boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền cập nhật gói Premium!';
  END IF;

  UPDATE public.users
  SET ispremium = p_is_premium
  WHERE id::text = p_user_id::text;

  RETURN true;
END;
$$;

-- 13. HÀM RPC CẬP NHẬT TOÀN DIỆN THÔNG TIN USER DÀNH CHO ADMIN
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id text,
  p_username text,
  p_email text,
  p_role text,
  p_is_premium boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền cập nhật người dùng!';
  END IF;

  UPDATE public.users
  SET 
    username = COALESCE(p_username, username),
    email = COALESCE(p_email, email),
    role = COALESCE(p_role, role),
    ispremium = COALESCE(p_is_premium, ispremium)
  WHERE id::text = p_user_id::text;

  RETURN true;
END;
$$;

-- 14. HÀM RPC XOÁ NGƯỜI DÙNG DÀNH CHO ADMIN
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền xoá người dùng!';
  END IF;

  DELETE FROM public.users
  WHERE id::text = p_user_id::text;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_role(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_premium(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(text) TO authenticated;

-- ==============================================================================
-- PHẦN 2: BẢO MẬT VÀ PHÂN QUYỀN CHO GIÁO TRÌNH (BOOK_SERIES, BOOKS, LESSONS)
-- ==============================================================================

-- 1. CẤP QUYỀN TABLE TRƯỚC KHI ÁP DỤNG RLS (Tránh lỗi: permission denied for table books)
GRANT ALL ON TABLE public.book_series TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.books TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lessons TO anon, authenticated, service_role;

-- 2. BẬT RLS
ALTER TABLE public.book_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES CHO BOOK_SERIES (BỘ GIÁO TRÌNH)
DROP POLICY IF EXISTS "Anyone can view book_series" ON public.book_series;
CREATE POLICY "Anyone can view book_series"
ON public.book_series FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert book_series" ON public.book_series;
CREATE POLICY "Admins can insert book_series"
ON public.book_series FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update book_series" ON public.book_series;
CREATE POLICY "Admins can update book_series"
ON public.book_series FOR UPDATE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete book_series" ON public.book_series;
CREATE POLICY "Admins can delete book_series"
ON public.book_series FOR DELETE TO authenticated
USING (public.is_admin());

-- 4. POLICIES CHO BOOKS (CUỐN SÁCH / CẤP ĐỘ)
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
CREATE POLICY "Anyone can view books"
ON public.books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
CREATE POLICY "Admins can insert books"
ON public.books FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update books" ON public.books;
CREATE POLICY "Admins can update books"
ON public.books FOR UPDATE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete books" ON public.books;
CREATE POLICY "Admins can delete books"
ON public.books FOR DELETE TO authenticated
USING (public.is_admin());

-- 5. POLICIES CHO LESSONS (BÀI HỌC)
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
CREATE POLICY "Anyone can view lessons"
ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert lessons" ON public.lessons;
CREATE POLICY "Admins can insert lessons"
ON public.lessons FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update lessons" ON public.lessons;
CREATE POLICY "Admins can update lessons"
ON public.lessons FOR UPDATE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete lessons" ON public.lessons;
CREATE POLICY "Admins can delete lessons"
ON public.lessons FOR DELETE TO authenticated
USING (public.is_admin());

-- 6. CÁC HÀM RPC ĐẶC QUYỀN ADMIN CHO LESSONS (AN TOÀN TUYỆT ĐỐI)
CREATE OR REPLACE FUNCTION public.admin_create_lesson(
  p_lesson_name text,
  p_book_id uuid,
  p_is_locked boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_lesson json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền tạo bài học!';
  END IF;

  INSERT INTO public.lessons ("lessonName", "bookId", "isLocked", "wordCount")
  VALUES (p_lesson_name, p_book_id, COALESCE(p_is_locked, false), 0)
  RETURNING row_to_json(public.lessons.*) INTO v_new_lesson;

  RETURN v_new_lesson;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_lesson(
  p_lesson_id uuid,
  p_lesson_name text,
  p_book_id uuid,
  p_is_locked boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_lesson json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền sửa bài học!';
  END IF;

  UPDATE public.lessons
  SET 
    "lessonName" = p_lesson_name,
    "bookId" = p_book_id,
    "isLocked" = COALESCE(p_is_locked, "isLocked"),
    "updatedAt" = NOW()
  WHERE id = p_lesson_id
  RETURNING row_to_json(public.lessons.*) INTO v_updated_lesson;

  RETURN v_updated_lesson;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_lesson_lock(
  p_lesson_id uuid,
  p_is_locked boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền đổi trạng thái bài học!';
  END IF;

  UPDATE public.lessons
  SET 
    "isLocked" = p_is_locked,
    "updatedAt" = NOW()
  WHERE id = p_lesson_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_lesson(
  p_lesson_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền xóa bài học!';
  END IF;

  DELETE FROM public.lessons
  WHERE id = p_lesson_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_bulk_create_lessons(
  p_lessons jsonb
)
RETURNS SETOF public.lessons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_new_lesson public.lessons;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền nhập hàng loạt bài học!';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_lessons)
  LOOP
    INSERT INTO public.lessons ("lessonName", "bookId", "isLocked", "wordCount", "createdAt", "updatedAt")
    VALUES (
      (v_item->>'lessonName')::text,
      (v_item->>'bookId')::uuid,
      COALESCE((v_item->>'isLocked')::boolean, false),
      COALESCE((v_item->>'wordCount')::integer, 0),
      NOW(),
      NOW()
    )
    RETURNING * INTO v_new_lesson;

    RETURN NEXT v_new_lesson;
  END LOOP;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_lesson(text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_lesson(uuid, text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_lesson_lock(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_lesson(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_create_lessons(jsonb) TO authenticated;

-- ==============================================================================
-- 10. PHÂN QUYỀN VÀ BẢO MẬT BẢNG VOCABULARIES (TỪ VỰNG)
-- ==============================================================================
GRANT ALL ON TABLE public.vocabularies TO anon, authenticated, service_role;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public vocabularies are viewable by everyone" ON public.vocabularies;
DROP POLICY IF EXISTS "Admins have full access to vocabularies" ON public.vocabularies;

CREATE POLICY "Public vocabularies are viewable by everyone"
ON public.vocabularies
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins have full access to vocabularies"
ON public.vocabularies
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RPC Nhập hàng loạt từ vựng (Bulk Create Vocabularies)
CREATE OR REPLACE FUNCTION public.admin_bulk_create_vocabularies(
  p_vocabularies jsonb
)
RETURNS SETOF public.vocabularies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_new_vocab public.vocabularies;
  v_ex jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Truy cập bị từ chối: Chỉ quản trị viên mới có quyền nhập từ vựng!';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_vocabularies)
  LOOP
    INSERT INTO public.vocabularies (
      "lessonId",
      "vocabulary",
      "pinyin",
      "vietnameseMeaning",
      "englishMeaning",
      "indonesiaMeaning",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      (v_item->>'lessonId')::uuid,
      (v_item->>'vocabulary')::text,
      COALESCE((v_item->>'pinyin')::text, ''),
      COALESCE((v_item->>'vietnameseMeaning')::text, ''),
      COALESCE((v_item->>'englishMeaning')::text, ''),
      (v_item->>'indonesiaMeaning')::text,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_new_vocab;

    -- Nếu có mảng câu ví dụ đi kèm (examples), chèn luôn vào bảng public.examples
    IF v_item ? 'examples' AND jsonb_typeof(v_item->'examples') = 'array' THEN
      FOR v_ex IN SELECT * FROM jsonb_array_elements(v_item->'examples')
      LOOP
        BEGIN
          -- Ưu tiên cột vocabularyid (chuẩn lowercase trên Supabase)
          INSERT INTO public.examples (
            vocabularyid,
            example,
            pinyin,
            vietnammeaning,
            englishmeaning,
            indonesiameaning,
            createdat,
            updatedat
          )
          VALUES (
            v_new_vocab.id,
            (v_ex->>'example')::text,
            COALESCE((v_ex->>'pinyin')::text, ''),
            COALESCE((v_ex->>'vietnammeaning')::text, COALESCE((v_ex->>'vietnameseMeaning')::text, '')),
            COALESCE((v_ex->>'englishmeaning')::text, COALESCE((v_ex->>'englishMeaning')::text, '')),
            COALESCE((v_ex->>'indonesiameaning')::text, (v_ex->>'indonesiaMeaning')::text),
            NOW(),
            NOW()
          );
        EXCEPTION WHEN undefined_column THEN
          -- Dự phòng nếu schema được đặt tên là "vocabularyId"
          INSERT INTO public.examples (
            "vocabularyId",
            example,
            pinyin,
            vietnammeaning,
            englishmeaning,
            indonesiameaning
          )
          VALUES (
            v_new_vocab.id,
            (v_ex->>'example')::text,
            COALESCE((v_ex->>'pinyin')::text, ''),
            COALESCE((v_ex->>'vietnammeaning')::text, COALESCE((v_ex->>'vietnameseMeaning')::text, '')),
            COALESCE((v_ex->>'englishmeaning')::text, COALESCE((v_ex->>'englishMeaning')::text, '')),
            COALESCE((v_ex->>'indonesiameaning')::text, (v_ex->>'indonesiaMeaning')::text)
          );
        END;
      END LOOP;
    END IF;

    RETURN NEXT v_new_vocab;
  END LOOP;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_bulk_create_vocabularies(jsonb) TO authenticated;

-- ==============================================================================
-- 11. PHÂN QUYỀN VÀ BẢO MẬT BẢNG EXAMPLES (CÂU VÍ DỤ TỪ VỰNG)
-- ==============================================================================
GRANT ALL ON TABLE public.examples TO anon, authenticated, service_role;
ALTER TABLE public.examples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public examples are viewable by everyone" ON public.examples;
DROP POLICY IF EXISTS "Admins have full access to examples" ON public.examples;

CREATE POLICY "Public examples are viewable by everyone"
ON public.examples
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins have full access to examples"
ON public.examples
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 12. PHÂN QUYỀN VÀ BẢO MẬT BẢNG READINGS VÀ READINGANSWERS (CÂU HỎI ĐỌC HIỂU)
-- ==============================================================================
-- Cấp quyền bảng readings
GRANT ALL ON TABLE public.readings TO anon, authenticated, service_role;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public readings are viewable by everyone" ON public.readings;
DROP POLICY IF EXISTS "Admins have full access to readings" ON public.readings;

CREATE POLICY "Public readings are viewable by everyone"
ON public.readings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins have full access to readings"
ON public.readings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Cấp quyền bảng readingAnswers
DO $$
BEGIN
  -- Thử cấp quyền cho readingAnswers (nếu bảng tồn tại)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'readingAnswers') THEN
    GRANT ALL ON TABLE public."readingAnswers" TO anon, authenticated, service_role;
    ALTER TABLE public."readingAnswers" ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public reading answers are viewable by everyone" ON public."readingAnswers";
    DROP POLICY IF EXISTS "Admins have full access to reading answers" ON public."readingAnswers";

    CREATE POLICY "Public reading answers are viewable by everyone"
    ON public."readingAnswers"
    FOR SELECT
    TO anon, authenticated
    USING (true);

    CREATE POLICY "Admins have full access to reading answers"
    ON public."readingAnswers"
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'readinganswers') THEN
    GRANT ALL ON TABLE public.readinganswers TO anon, authenticated, service_role;
    ALTER TABLE public.readinganswers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public reading answers are viewable by everyone" ON public.readinganswers;
    DROP POLICY IF EXISTS "Admins have full access to reading answers" ON public.readinganswers;

    CREATE POLICY "Public reading answers are viewable by everyone"
    ON public.readinganswers
    FOR SELECT
    TO anon, authenticated
    USING (true);

    CREATE POLICY "Admins have full access to reading answers"
    ON public.readinganswers
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;



