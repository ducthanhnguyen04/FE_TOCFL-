ALTER TABLE public.readings ADD COLUMN IF NOT EXISTS pinyin TEXT;
ALTER TABLE public.readings ADD COLUMN IF NOT EXISTS "vietnameseMeaning" TEXT;

WITH lesson1 AS (
  SELECT id FROM public.lessons WHERE "lessonName" = 'Xin chào!' LIMIT 1
),
r1 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '____好，我叫小明。', '____ hǎo, wǒ jiào Xiǎomíng.', 'Chào bạn, tôi tên Tiểu Minh.' FROM lesson1 RETURNING id),
r2 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '你____吗？', 'Nǐ ____ ma?', 'Bạn khỏe không?' FROM lesson1 RETURNING id),
r3 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '____好，我是老师。', '____ hǎo, wǒ shì lǎoshī.', 'Chào các bạn, tôi là giáo viên.' FROM lesson1 RETURNING id),
r4 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '王____，你好！', 'Wáng ____, nǐ hǎo!', 'Chào thầy Vương!' FROM lesson1 RETURNING id),
r5 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '____你！ - 不客气。', '____ nǐ! - Bú kèqì.', 'Cảm ơn bạn! - Không có gì.' FROM lesson1 RETURNING id),
r6 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '谢谢你。 - ____。', 'Xièxie nǐ. - ____.', 'Cảm ơn bạn. - Đừng khách sáo.' FROM lesson1 RETURNING id),
r7 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '____好！', '____ hǎo!', 'Chào ngài/ông/bà! (kính trọng)' FROM lesson1 RETURNING id),
r8 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '明天____。', 'Míngtiān ____.', 'Ngày mai tạm biệt / gặp lại.' FROM lesson1 RETURNING id),
r9 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '____，我迟到了。', '____, wǒ chídào le.', 'Xin lỗi, tôi đến muộn.' FROM lesson1 RETURNING id),
r10 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '对不起。 - ____。', 'Duìbuqǐ. - ____.', 'Xin lỗi. - Không sao đâu.' FROM lesson1 RETURNING id),
r11 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '你____什么名字？', 'Nǐ ____ shénme míngzi?', 'Bạn tên là gì?' FROM lesson1 RETURNING id),
r12 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '你叫____名字？', 'Nǐ jiào ____ míngzi?', 'Bạn tên là gì?' FROM lesson1 RETURNING id),
r13 AS (INSERT INTO public.readings ("lessonId", question, pinyin, "vietnameseMeaning") SELECT id, '你的____是什么？', 'Nǐ de ____ shì shénme?', 'Tên của bạn là gì?' FROM lesson1 RETURNING id)

INSERT INTO public."readingAnswers" ("readingId", answer)
SELECT id, '你' FROM r1 UNION ALL
SELECT id, '好' FROM r2 UNION ALL
SELECT id, '你们' FROM r3 UNION ALL
SELECT id, '老师' FROM r4 UNION ALL
SELECT id, '谢谢' FROM r5 UNION ALL
SELECT id, '不客气' FROM r6 UNION ALL
SELECT id, '您' FROM r7 UNION ALL
SELECT id, '再见' FROM r8 UNION ALL
SELECT id, '对不起' FROM r9 UNION ALL
SELECT id, '没关系' FROM r10 UNION ALL
SELECT id, '叫' FROM r11 UNION ALL
SELECT id, '什么' FROM r12 UNION ALL
SELECT id, '名字' FROM r13;
