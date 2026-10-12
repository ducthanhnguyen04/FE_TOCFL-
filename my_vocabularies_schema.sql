-- ==========================================
-- TẠO BẢNG MY_VOCAB_SETS (BỘ TỪ VỰNG CÁ NHÂN)
-- ==========================================
CREATE TABLE IF NOT EXISTS public."myVocabSets" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public."myVocabSets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vocab sets"
ON public."myVocabSets"
FOR ALL
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");


-- ==========================================
-- TẠO BẢNG MY_VOCABULARIES (TỪ VỰNG CÁ NHÂN)
-- ==========================================
CREATE TABLE IF NOT EXISTS public."myVocabularies" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vocabulary TEXT NOT NULL,
  pinyin TEXT,
  meaning TEXT,
  example TEXT,
  "examplePinyin" TEXT,
  "exampleMeaning" TEXT,
  "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "setId" UUID REFERENCES public."myVocabSets"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Row Level Security (RLS) để chỉ user tạo mới thấy và sửa được
ALTER TABLE public."myVocabularies" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vocabularies"
ON public."myVocabularies"
FOR ALL
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");
