import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Hàm xác thực quyền Admin nghiêm ngặt trên Server
async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Vui lòng đăng nhập.', status: 401 };
  }

  // Tra cứu role trực tiếp từ database trên server
  let role: string | null = (user.user_metadata?.role || user.app_metadata?.role) as string | null;

  if (!role) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role) {
      role = profile.role;
    }
  }

  if (!role && user.email) {
    const { data: profileEmail } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();

    if (profileEmail?.role) {
      role = profileEmail.role;
    }
  }

  if (role !== 'admin') {
    return { error: 'Forbidden. Chỉ quản trị viên mới có quyền thao tác!', status: 403 };
  }

  return { user, supabase };
}

// Hàm hỗ trợ cập nhật lại wordCount trong bảng lessons
async function syncLessonWordCount(supabase: any, lessonId: string) {
  if (!lessonId) return;
  try {
    const { count, error } = await supabase
      .from('vocabularies')
      .select('*', { count: 'exact', head: true })
      .eq('lessonId', lessonId);

    if (!error) {
      await supabase
        .from('lessons')
        .update({
          wordCount: count || 0,
          updatedAt: new Date().toISOString()
        })
        .eq('id', lessonId);
    }
  } catch (e) {
    console.warn(`Lỗi đồng bộ wordCount cho bài học ${lessonId}:`, e);
  }
}

// 1. GET: Lấy danh sách từ vựng (kèm Examples, Bài học & Sách) và danh sách bài học để lọc
export async function GET(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { searchParams } = new URL(req.url);
  const lessonIdParam = searchParams.get('lessonId');

  try {
    // 1. Truy vấn danh sách từ vựng kèm câu ví dụ
    let query = supabase
      .from('vocabularies')
      .select(`
        *,
        examples (
          id,
          example,
          pinyin,
          vietnammeaning,
          englishmeaning,
          indonesiameaning
        ),
        lessons (
          id,
          lessonName,
          bookId,
          books (
            id,
            bookName,
            bookSeriId,
            book_series (
              id,
              name
            )
          )
        )
      `)
      .order('createdAt', { ascending: true });

    if (lessonIdParam && lessonIdParam !== 'all') {
      query = query.eq('lessonId', lessonIdParam);
    }

    const { data: vocabularies, error: vocabError } = await query;
    if (vocabError) throw vocabError;

    // 2. Lấy danh sách các bài học kèm thông tin sách để hiển thị bộ lọc & dropdown
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        lessonName,
        bookId,
        books (
          id,
          bookName,
          bookSeriId,
          book_series (
            id,
            name
          )
        )
      `)
      .order('lessonName', { ascending: true });

    if (lessonsError) throw lessonsError;

    return NextResponse.json({
      vocabularies: vocabularies || [],
      lessons: lessons || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải dữ liệu từ vựng' }, { status: 500 });
  }
}

// 2. POST: Thêm mới, Cập nhật hoặc Nhập hàng loạt từ vựng (kèm câu ví dụ)
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;

  try {
    const body = await req.json();
    const {
      action,
      id,
      lessonId,
      vocabulary,
      pinyin,
      vietnameseMeaning,
      englishMeaning,
      indonesiaMeaning,
      example,
      examplePinyin,
      exampleVietnamMeaning,
      exampleEnglishMeaning,
      exampleIndonesiaMeaning,
      examples: customExamples,
      vocabularies: bulkList,
      defaultLessonId
    } = body;

    // A. Thêm từ vựng đơn lẻ (kèm ví dụ nếu có)
    if (action === 'create_vocabulary') {
      if (!vocabulary || !vocabulary.trim()) {
        return NextResponse.json({ error: 'Từ vựng (Hán tự) không được để trống' }, { status: 400 });
      }
      if (!lessonId) {
        return NextResponse.json({ error: 'Vui lòng chọn bài học cho từ vựng này' }, { status: 400 });
      }

      const { data: newVocab, error: vocabErr } = await supabase
        .from('vocabularies')
        .insert({
          lessonId,
          vocabulary: vocabulary.trim(),
          pinyin: (pinyin || '').trim(),
          vietnameseMeaning: (vietnameseMeaning || '').trim(),
          englishMeaning: (englishMeaning || '').trim(),
          indonesiaMeaning: (indonesiaMeaning || null)
        })
        .select(`
          *,
          lessons (
            id,
            lessonName,
            bookId,
            books (
              id,
              bookName,
              bookSeriId,
              book_series (
                id,
                name
              )
            )
          )
        `)
        .single();

      if (vocabErr) throw vocabErr;

      // Chèn câu ví dụ nếu có nhập
      if (example && example.trim()) {
        const exPayload: any = {
          vocabularyid: newVocab.id,
          example: example.trim(),
          pinyin: (examplePinyin || '').trim(),
          vietnammeaning: (exampleVietnamMeaning || '').trim(),
          englishmeaning: (exampleEnglishMeaning || '').trim(),
          indonesiameaning: (exampleIndonesiaMeaning || null)
        };
        let { error: insertExErr } = await supabase.from('examples').insert(exPayload);
        if (insertExErr) {
          delete exPayload.vocabularyid;
          exPayload.vocabularyId = newVocab.id;
          await supabase.from('examples').insert(exPayload);
        }
      }

      // Cập nhật lại wordCount của bài học
      await syncLessonWordCount(supabase, lessonId);

      return NextResponse.json({ success: true, vocabulary: newVocab });
    }

    // B. Cập nhật từ vựng (và câu ví dụ)
    if (action === 'update_vocabulary') {
      if (!id) {
        return NextResponse.json({ error: 'Thiếu ID từ vựng cần cập nhật' }, { status: 400 });
      }
      if (!vocabulary || !vocabulary.trim()) {
        return NextResponse.json({ error: 'Từ vựng (Hán tự) không được để trống' }, { status: 400 });
      }
      if (!lessonId) {
        return NextResponse.json({ error: 'Vui lòng chọn bài học' }, { status: 400 });
      }

      // Lấy thông tin bài học cũ để đồng bộ wordCount nếu chuyển bài
      const { data: existing } = await supabase
        .from('vocabularies')
        .select('lessonId')
        .eq('id', id)
        .single();

      const { data: updatedVocab, error: updateErr } = await supabase
        .from('vocabularies')
        .update({
          lessonId,
          vocabulary: vocabulary.trim(),
          pinyin: (pinyin || '').trim(),
          vietnameseMeaning: (vietnameseMeaning || '').trim(),
          englishMeaning: (englishMeaning || '').trim(),
          indonesiaMeaning: (indonesiaMeaning || null),
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          lessons (
            id,
            lessonName,
            bookId,
            books (
              id,
              bookName,
              bookSeriId,
              book_series (
                id,
                name
              )
            )
          )
        `)
        .single();

      if (updateErr) throw updateErr;

      // Cập nhật câu ví dụ
      if (example && example.trim()) {
        let { data: existingEx } = await supabase
          .from('examples')
          .select('id')
          .eq('vocabularyid', id)
          .maybeSingle();

        if (!existingEx) {
          const check2 = await supabase
            .from('examples')
            .select('id')
            .eq('vocabularyId', id)
            .maybeSingle();
          existingEx = check2.data;
        }

        if (existingEx) {
          await supabase
            .from('examples')
            .update({
              example: example.trim(),
              pinyin: (examplePinyin || '').trim(),
              vietnammeaning: (exampleVietnamMeaning || '').trim(),
              englishmeaning: (exampleEnglishMeaning || '').trim(),
              indonesiameaning: (exampleIndonesiaMeaning || null),
              updatedat: new Date().toISOString()
            })
            .eq('id', existingEx.id);
        } else {
          const exPayload: any = {
            vocabularyid: id,
            example: example.trim(),
            pinyin: (examplePinyin || '').trim(),
            vietnammeaning: (exampleVietnamMeaning || '').trim(),
            englishmeaning: (exampleEnglishMeaning || '').trim(),
            indonesiameaning: (exampleIndonesiaMeaning || null)
          };
          let { error: insErr } = await supabase.from('examples').insert(exPayload);
          if (insErr) {
            delete exPayload.vocabularyid;
            exPayload.vocabularyId = id;
            await supabase.from('examples').insert(exPayload);
          }
        }
      }

      // Đồng bộ wordCount
      await syncLessonWordCount(supabase, lessonId);
      if (existing?.lessonId && existing.lessonId !== lessonId) {
        await syncLessonWordCount(supabase, existing.lessonId);
      }

      return NextResponse.json({ success: true, vocabulary: updatedVocab });
    }

    // C. Nhập hàng loạt từ vựng KÈM CÂU VÍ DỤ VÀ CÂU HỎI ĐỌC HIỂU (Bulk import with examples & readings)
    if (action === 'bulk_create') {
      const rawBulkList = Array.isArray(bulkList)
        ? bulkList
        : (Array.isArray(body) ? body : (body.vocabularies || []));

      if (!Array.isArray(rawBulkList) || rawBulkList.length === 0) {
        return NextResponse.json({ error: 'Dữ liệu nhập vào phải là một mảng JSON các từ vựng (không được để trống)' }, { status: 400 });
      }

      const rowsToInsert = [];
      const readingsToInsert: {
        lessonId: string;
        question: string;
        pinyin: string;
        vietnameseMeaning: string;
        answers: string[];
      }[] = [];
      const affectedLessonIds = new Set<string>();

      for (let i = 0; i < rawBulkList.length; i++) {
        const item = rawBulkList[i];
        const wordText = (item.vocabulary || item.word || item.hanzi || item.chinese || '').trim();
        const lId = item.lessonId || defaultLessonId;

        if (!wordText && !item.question) {
          return NextResponse.json({ error: `Phần tử #${i + 1} thiếu cả Hán tự từ vựng lẫn câu hỏi đọc hiểu` }, { status: 400 });
        }
        if (!lId) {
          return NextResponse.json({ error: `Dữ liệu #${i + 1} ("${wordText || item.question}") chưa được gán vào bài học nào (lessonId)` }, { status: 400 });
        }

        affectedLessonIds.add(lId);

        // 1. Nếu có từ vựng thì đưa vào rowsToInsert
        if (wordText) {
          // Chuẩn hóa câu ví dụ đi kèm (nếu có)
          let exList: any[] = [];
          if (Array.isArray(item.examples) && item.examples.length > 0) {
            exList = item.examples;
          } else if (item.example && typeof item.example === 'string' && item.example.trim()) {
            exList = [{
              example: item.example.trim(),
              pinyin: (item.examplePinyin || item.example_pinyin || '').trim(),
              vietnammeaning: (item.exampleVietnamMeaning || item.example_meaning || item.exampleMeaning || item.exampleVietnammeaning || item.vietnammeaning || '').trim(),
              englishmeaning: (item.exampleEnglishMeaning || item.example_english || item.englishmeaning || '').trim(),
              indonesiameaning: (item.exampleIndonesiaMeaning || item.example_indonesia || item.indonesiameaning || null)
            }];
          }

          rowsToInsert.push({
            lessonId: lId,
            vocabulary: wordText,
            pinyin: (item.pinyin || '').trim(),
            vietnameseMeaning: (item.vietnameseMeaning || item.meaning || item.vietnamMeaning || item.vietnamese || '').trim(),
            englishMeaning: (item.englishMeaning || item.english || '').trim(),
            indonesiaMeaning: (item.indonesiaMeaning || item.indonesia || null),
            examples: exList
          });
        }

        // 2. Thu thập câu hỏi đọc hiểu & đáp án đi kèm
        // A. Dạng mảng readings: [{ question, pinyin, vietnameseMeaning, answer / answers }]
        if (Array.isArray(item.readings) && item.readings.length > 0) {
          for (const r of item.readings) {
            const qText = (r.question || r.sentence || r.text || '').trim();
            if (qText) {
              let ansList: string[] = [];
              if (Array.isArray(r.answers)) {
                ansList = r.answers.map((a: any) => String(a).trim()).filter(Boolean);
              } else if (r.answer && String(r.answer).trim()) {
                ansList = [String(r.answer).trim()];
              } else if (r.correctAnswer && String(r.correctAnswer).trim()) {
                ansList = [String(r.correctAnswer).trim()];
              } else if (wordText) {
                ansList = [wordText];
              }

              readingsToInsert.push({
                lessonId: r.lessonId || lId,
                question: qText,
                pinyin: (r.pinyin || r.readingPinyin || '').trim(),
                vietnameseMeaning: (r.vietnameseMeaning || r.vietnammeaning || r.meaning || r.readingMeaning || '').trim(),
                answers: ansList
              });
            }
          }
        }
        // B. Dạng object reading duy nhất: { question, pinyin, answer }
        else if (item.reading && typeof item.reading === 'object') {
          const r = item.reading;
          const qText = (r.question || r.sentence || r.text || '').trim();
          if (qText) {
            let ansList: string[] = [];
            if (Array.isArray(r.answers)) {
              ansList = r.answers.map((a: any) => String(a).trim()).filter(Boolean);
            } else if (r.answer && String(r.answer).trim()) {
              ansList = [String(r.answer).trim()];
            } else if (wordText) {
              ansList = [wordText];
            }

            readingsToInsert.push({
              lessonId: r.lessonId || lId,
              question: qText,
              pinyin: (r.pinyin || '').trim(),
              vietnameseMeaning: (r.vietnameseMeaning || r.meaning || '').trim(),
              answers: ansList
            });
          }
        }
        // C. Các trường question / answer nằm trực tiếp trên item
        else if (item.question && typeof item.question === 'string' && item.question.trim()) {
          const qText = item.question.trim();
          let ansList: string[] = [];
          if (Array.isArray(item.answers)) {
            ansList = item.answers.map((a: any) => String(a).trim()).filter(Boolean);
          } else if (item.answer && String(item.answer).trim()) {
            ansList = [String(item.answer).trim()];
          } else if (item.readingAnswer && String(item.readingAnswer).trim()) {
            ansList = [String(item.readingAnswer).trim()];
          } else if (wordText) {
            ansList = [wordText];
          }

          readingsToInsert.push({
            lessonId: lId,
            question: qText,
            pinyin: (item.readingPinyin || item.examplePinyin || '').trim(),
            vietnameseMeaning: (item.readingMeaning || item.readingVietnameseMeaning || '').trim(),
            answers: ansList
          });
        }
      }

      // 3. Nếu ở root body có truyền thêm mảng readings riêng biệt: { vocabularies: [...], readings: [...] }
      if (Array.isArray(body.readings) && body.readings.length > 0) {
        for (const r of body.readings) {
          const qText = (r.question || r.sentence || r.text || '').trim();
          const rLId = r.lessonId || defaultLessonId;
          if (qText && rLId) {
            let ansList: string[] = [];
            if (Array.isArray(r.answers)) {
              ansList = r.answers.map((a: any) => String(a).trim()).filter(Boolean);
            } else if (r.answer && String(r.answer).trim()) {
              ansList = [String(r.answer).trim()];
            }
            readingsToInsert.push({
              lessonId: rLId,
              question: qText,
              pinyin: (r.pinyin || '').trim(),
              vietnameseMeaning: (r.vietnameseMeaning || r.meaning || '').trim(),
              answers: ansList
            });
          }
        }
      }

      let insertedVocabs: any[] | null = null;
      let insertedExampleCount = 0;

      // 4. Chèn từ vựng & ví dụ (nếu có)
      if (rowsToInsert.length > 0) {
        // 4a. Thử gọi hàm RPC admin_bulk_create_vocabularies (nếu đã tạo trong Supabase)
        const { data: rpcData, error: rpcError } = await supabase.rpc('admin_bulk_create_vocabularies', {
          p_vocabularies: rowsToInsert
        });

        if (!rpcError && rpcData) {
          insertedVocabs = rpcData;
          insertedExampleCount = rowsToInsert.reduce((acc, row) => acc + (row.examples ? row.examples.length : 0), 0);
        } else {
          // 4b. Fallback chèn trực tiếp vào bảng vocabularies
          const pureVocabRows = rowsToInsert.map(r => ({
            lessonId: r.lessonId,
            vocabulary: r.vocabulary,
            pinyin: r.pinyin,
            vietnameseMeaning: r.vietnameseMeaning,
            englishMeaning: r.englishMeaning,
            indonesiaMeaning: r.indonesiaMeaning
          }));

          const { data: directData, error: vocabErr } = await supabase
            .from('vocabularies')
            .insert(pureVocabRows)
            .select('id, vocabulary, lessonId');

          if (vocabErr) {
            if (vocabErr.message?.toLowerCase().includes('permission denied')) {
              return NextResponse.json({
                error: 'Lỗi phân quyền Supabase: Chưa cấp quyền cho bảng vocabularies. Vui lòng mở file supabase_admin_security.sql, copy Mục 10 & 11 dán vào SQL Editor của Supabase và bấm RUN để cấp quyền!'
              }, { status: 403 });
            }
            throw vocabErr;
          }

          insertedVocabs = directData;

          // Chèn câu ví dụ vào bảng examples
          if (Array.isArray(insertedVocabs) && insertedVocabs.length > 0) {
            const rawExampleRows: any[] = [];

            for (let i = 0; i < rowsToInsert.length; i++) {
              const row = rowsToInsert[i];
              const vocabId = insertedVocabs[i]?.id;
              if (!vocabId || !row.examples || row.examples.length === 0) continue;

              for (const ex of row.examples) {
                const exText = (ex.example || ex.sentence || ex.chinese || '').trim();
                if (exText) {
                  rawExampleRows.push({
                    vocabId: vocabId,
                    example: exText,
                    pinyin: (ex.pinyin || '').trim(),
                    vietnammeaning: (ex.vietnammeaning || ex.vietnameseMeaning || ex.meaning || ex.vietnamMeaning || '').trim(),
                    englishmeaning: (ex.englishmeaning || ex.englishMeaning || ex.english || '').trim(),
                    indonesiameaning: (ex.indonesiameaning || ex.indonesiaMeaning || ex.indonesia || null)
                  });
                }
              }
            }

            if (rawExampleRows.length > 0) {
              const payloadLower = rawExampleRows.map(e => ({
                vocabularyid: e.vocabId,
                example: e.example,
                pinyin: e.pinyin,
                vietnammeaning: e.vietnammeaning,
                englishmeaning: e.englishmeaning,
                indonesiameaning: e.indonesiameaning
              }));

              let { data: exData, error: exErr } = await supabase
                .from('examples')
                .insert(payloadLower)
                .select('id');

              if (exErr) {
                console.warn('Chèn với vocabularyid thất bại, thử lại với vocabularyId:', exErr.message);
                const payloadCamel = rawExampleRows.map(e => ({
                  vocabularyId: e.vocabId,
                  example: e.example,
                  pinyin: e.pinyin,
                  vietnammeaning: e.vietnammeaning,
                  englishmeaning: e.englishmeaning,
                  indonesiameaning: e.indonesiameaning
                }));

                const retry = await supabase
                  .from('examples')
                  .insert(payloadCamel)
                  .select('id');

                exData = retry.data;
                exErr = retry.error;
              }

              if (!exErr && exData) {
                insertedExampleCount = exData.length;
              } else if (exErr) {
                console.error('Lỗi khi chèn câu ví dụ vào bảng examples:', exErr);
              }
            }
          }
        }
      }

      // 5. Chèn câu hỏi đọc hiểu vào bảng readings & readingAnswers (nếu có)
      let insertedReadingCount = 0;
      let insertedReadingAnswerCount = 0;

      if (readingsToInsert.length > 0) {
        const pureReadingRows = readingsToInsert.map(r => ({
          lessonId: r.lessonId,
          question: r.question,
          pinyin: r.pinyin,
          vietnameseMeaning: r.vietnameseMeaning,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        const { data: insertedReadings, error: readErr } = await supabase
          .from('readings')
          .insert(pureReadingRows)
          .select('id, question, lessonId');

        if (!readErr && insertedReadings) {
          insertedReadingCount = insertedReadings.length;

          // Chèn các đáp án tương ứng vào readingAnswers
          const allAnswerRows: any[] = [];
          for (let i = 0; i < insertedReadings.length; i++) {
            const createdR = insertedReadings[i];
            const ansList = readingsToInsert[i]?.answers || [];
            for (const ans of ansList) {
              allAnswerRows.push({
                readingId: createdR.id,
                answer: ans
              });
            }
          }

          if (allAnswerRows.length > 0) {
            let { data: ansData, error: ansErr } = await supabase
              .from('readingAnswers')
              .insert(allAnswerRows)
              .select('id');

            if (ansErr) {
              // Thử cột readingid (lowercase)
              const payloadLower = allAnswerRows.map(a => ({
                readingid: a.readingId,
                answer: a.answer
              }));
              const retry1 = await supabase.from('readingAnswers').insert(payloadLower).select('id');
              if (!retry1.error && retry1.data) {
                insertedReadingAnswerCount = retry1.data.length;
              } else {
                const retry2 = await supabase.from('"readingAnswers"').insert(allAnswerRows).select('id');
                if (!retry2.error && retry2.data) {
                  insertedReadingAnswerCount = retry2.data.length;
                }
              }
            } else if (ansData) {
              insertedReadingAnswerCount = ansData.length;
            }
          }
        } else if (readErr) {
          console.warn('Lỗi chèn readings trong bulk vocab import:', readErr.message);
        }
      }

      // 6. Cập nhật wordCount cho toàn bộ các bài học bị ảnh hưởng
      for (const lesId of Array.from(affectedLessonIds)) {
        await syncLessonWordCount(supabase, lesId);
      }

      const totalVocabCount = insertedVocabs ? insertedVocabs.length : rowsToInsert.length;
      const parts = [];
      if (totalVocabCount > 0) parts.push(`${totalVocabCount} từ vựng`);
      if (insertedExampleCount > 0) parts.push(`${insertedExampleCount} câu ví dụ`);
      if (insertedReadingCount > 0) parts.push(`${insertedReadingCount} câu hỏi đọc hiểu`);
      if (insertedReadingAnswerCount > 0) parts.push(`${insertedReadingAnswerCount} đáp án reading`);

      return NextResponse.json({
        success: true,
        count: totalVocabCount,
        exampleCount: insertedExampleCount,
        readingCount: insertedReadingCount,
        readingAnswerCount: insertedReadingAnswerCount,
        message: `Đã nhập thành công ${parts.join(', ')} vào cơ sở dữ liệu!`
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý server' }, { status: 500 });
  }
}

// 3. DELETE: Xóa từ vựng (kèm xóa câu ví dụ liên quan)
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID từ vựng cần xóa' }, { status: 400 });
  }

  try {
    // 1. Lấy lessonId trước khi xóa để đồng bộ lại wordCount
    const { data: existing } = await supabase
      .from('vocabularies')
      .select('lessonId')
      .eq('id', id)
      .maybeSingle();

    // 2. Xóa các ví dụ liên quan trong bảng examples (thử cả vocabularyid và vocabularyId)
    await supabase.from('examples').delete().eq('vocabularyid', id);
    await supabase.from('examples').delete().eq('vocabularyId', id);

    // 3. Xóa từ vựng trong bảng vocabularies
    const { error } = await supabase
      .from('vocabularies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (existing?.lessonId) {
      await syncLessonWordCount(supabase, existing.lessonId);
    }

    return NextResponse.json({ success: true, message: 'Đã xóa từ vựng thành công' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi xóa từ vựng' }, { status: 500 });
  }
}
