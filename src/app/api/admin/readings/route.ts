import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 1. Hàm xác thực quyền Admin trên Server
async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Vui lòng đăng nhập.', status: 401 };
  }

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

// Hàm trích xuất số bài học để sắp xếp tự nhiên
function extractLessonNum(name: string): number {
  if (!name) return 999999;
  const match = name.match(/(?:bài|lesson|chương|unit|đoạn|phần|tiết|第)\s*(\d+)/i) || name.match(/\d+/);
  return match ? parseInt(match[1] || match[0], 10) : 999999;
}

// 2. GET: Lấy danh sách câu hỏi đọc hiểu kèm đáp án và danh sách bài học
export async function GET(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { searchParams } = new URL(req.url);
  const lessonIdParam = searchParams.get('lessonId');

  try {
    // A. Truy vấn danh sách câu hỏi đọc hiểu (readings)
    let readingsQuery = supabase
      .from('readings')
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
      .order('createdAt', { ascending: true });

    if (lessonIdParam && lessonIdParam !== 'all') {
      readingsQuery = readingsQuery.eq('lessonId', lessonIdParam);
    }

    const { data: readingsData, error: readingsError } = await readingsQuery;
    if (readingsError) throw readingsError;

    // B. Lấy các đáp án liên quan trong bảng readingAnswers
    let answersMap: Record<string, any[]> = {};
    if (readingsData && readingsData.length > 0) {
      const readingIds = readingsData.map(r => r.id);

      // Thử bảng readingAnswers
      let { data: ansData, error: ansErr } = await supabase
        .from('readingAnswers')
        .select('*')
        .in('readingId', readingIds);

      // Thử fallback nếu bảng dùng dấu ngoặc kép hoặc cột readingid
      if (ansErr) {
        const fallback1 = await supabase
          .from('"readingAnswers"')
          .select('*')
          .in('readingId', readingIds);

        if (!fallback1.error && fallback1.data) {
          ansData = fallback1.data;
          ansErr = null;
        } else {
          // Thử tìm theo cột readingid (lowercase)
          const fallback2 = await supabase
            .from('readingAnswers')
            .select('*')
            .in('readingid', readingIds);
          if (!fallback2.error && fallback2.data) {
            ansData = fallback2.data;
            ansErr = null;
          }
        }
      }

      if (ansData) {
        for (const a of ansData) {
          const rId = a.readingId || a.readingid;
          if (rId) {
            if (!answersMap[rId]) {
              answersMap[rId] = [];
            }
            answersMap[rId].push(a);
          }
        }
      }
    }

    // Ghép câu hỏi với danh sách đáp án
    const mergedReadings = (readingsData || []).map(r => {
      const answers = answersMap[r.id] || [];
      const primaryAnswer = answers[0]?.answer || '';
      return {
        ...r,
        answers: answers.map(a => a.answer),
        readingAnswers: answers,
        primaryAnswer: primaryAnswer,
        fullSentence: r.question ? r.question.replace('____', primaryAnswer || '____') : ''
      };
    });

    // C. Lấy danh sách bài học và sắp xếp tự nhiên
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, lessonName, bookId, books(id, bookName, bookSeriId, book_series(id, name))');

    if (lessonsError) throw lessonsError;

    const sortedLessons = (lessonsData || []).sort((a: any, b: any) => {
      const numA = extractLessonNum(a.lessonName);
      const numB = extractLessonNum(b.lessonName);
      if (numA !== numB) return numA - numB;
      return (a.lessonName || '').localeCompare(b.lessonName || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    // D. Lấy danh sách sách (books)
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, bookName, bookSeriId, book_series(id, name)')
      .order('bookName', { ascending: true });

    if (booksError) throw booksError;

    return NextResponse.json({
      readings: mergedReadings,
      lessons: sortedLessons,
      books: booksData || []
    });
  } catch (err: any) {
    console.error('Lỗi khi tải dữ liệu đọc hiểu:', err);
    return NextResponse.json({ error: err.message || 'Lỗi xử lý server' }, { status: 500 });
  }
}

// 3. POST: Thêm mới câu hỏi, cập nhật câu hỏi, nhập hàng loạt
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
      question,
      pinyin,
      vietnameseMeaning,
      answer,
      answers,
      readings: bulkList,
      defaultLessonId
    } = body;

    // Helper: chèn đáp án an toàn hỗ trợ cả readingId và readingid
    const insertAnswersForReading = async (readingId: string, ansList: string[]) => {
      if (!ansList || ansList.length === 0) return 0;

      const payload1 = ansList.map(a => ({
        readingId: readingId,
        answer: a.trim()
      }));

      let { data, error } = await supabase.from('readingAnswers').insert(payload1).select('id');

      if (error) {
        // Thử với "readingAnswers" hoặc readingid
        const payload2 = ansList.map(a => ({
          readingid: readingId,
          answer: a.trim()
        }));
        const retry1 = await supabase.from('readingAnswers').insert(payload2).select('id');
        if (!retry1.error && retry1.data) {
          return retry1.data.length;
        }

        const retry2 = await supabase.from('"readingAnswers"').insert(payload1).select('id');
        if (!retry2.error && retry2.data) {
          return retry2.data.length;
        }

        console.warn('Lỗi chèn readingAnswers:', error.message);
        return 0;
      }

      return data ? data.length : 0;
    };

    // Helper: xóa đáp án cũ của câu hỏi
    const deleteAnswersForReading = async (readingId: string) => {
      await supabase.from('readingAnswers').delete().eq('readingId', readingId);
      await supabase.from('readingAnswers').delete().eq('readingid', readingId);
      await supabase.from('"readingAnswers"').delete().eq('readingId', readingId);
    };

    // A. Thêm mới câu hỏi đọc hiểu đơn lẻ
    if (action === 'create_reading') {
      if (!question || !question.trim()) {
        return NextResponse.json({ error: 'Nội dung câu hỏi không được để trống' }, { status: 400 });
      }
      if (!lessonId) {
        return NextResponse.json({ error: 'Vui lòng chọn bài học' }, { status: 400 });
      }

      const qText = question.trim();
      const rawAnsList: string[] = Array.isArray(answers) && answers.length > 0
        ? answers
        : (answer ? [answer] : []);

      const validAnswers = rawAnsList.map(a => String(a).trim()).filter(Boolean);
      if (validAnswers.length === 0) {
        return NextResponse.json({ error: 'Vui lòng nhập ít nhất một đáp án đúng cho câu hỏi' }, { status: 400 });
      }

      const { data: newReading, error: createErr } = await supabase
        .from('readings')
        .insert({
          lessonId: lessonId,
          question: qText,
          pinyin: (pinyin || '').trim(),
          vietnameseMeaning: (vietnameseMeaning || '').trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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

      if (createErr) {
        if (createErr.message?.toLowerCase().includes('permission denied')) {
          return NextResponse.json({
            error: 'Lỗi phân quyền Supabase: Chưa cấp quyền bảng readings. Vui lòng chạy Mục 12 trong file supabase_admin_security.sql trên Supabase SQL Editor!'
          }, { status: 403 });
        }
        throw createErr;
      }

      // Chèn đáp án vào readingAnswers
      await insertAnswersForReading(newReading.id, validAnswers);

      return NextResponse.json({
        success: true,
        reading: {
          ...newReading,
          answers: validAnswers,
          primaryAnswer: validAnswers[0] || '',
          fullSentence: newReading.question ? newReading.question.replace('____', validAnswers[0] || '') : ''
        }
      });
    }

    // B. Cập nhật câu hỏi đọc hiểu
    if (action === 'update_reading') {
      if (!id) {
        return NextResponse.json({ error: 'Thiếu ID câu hỏi cần cập nhật' }, { status: 400 });
      }
      if (!question || !question.trim()) {
        return NextResponse.json({ error: 'Nội dung câu hỏi không được để trống' }, { status: 400 });
      }
      if (!lessonId) {
        return NextResponse.json({ error: 'Vui lòng chọn bài học' }, { status: 400 });
      }

      const rawAnsList: string[] = Array.isArray(answers) && answers.length > 0
        ? answers
        : (answer ? [answer] : []);

      const validAnswers = rawAnsList.map(a => String(a).trim()).filter(Boolean);
      if (validAnswers.length === 0) {
        return NextResponse.json({ error: 'Vui lòng nhập ít nhất một đáp án đúng cho câu hỏi' }, { status: 400 });
      }

      const { data: updatedReading, error: updateErr } = await supabase
        .from('readings')
        .update({
          lessonId: lessonId,
          question: question.trim(),
          pinyin: (pinyin || '').trim(),
          vietnameseMeaning: (vietnameseMeaning || '').trim(),
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

      // Cập nhật lại danh sách đáp án
      await deleteAnswersForReading(id);
      await insertAnswersForReading(id, validAnswers);

      return NextResponse.json({
        success: true,
        reading: {
          ...updatedReading,
          answers: validAnswers,
          primaryAnswer: validAnswers[0] || '',
          fullSentence: updatedReading.question ? updatedReading.question.replace('____', validAnswers[0] || '') : ''
        }
      });
    }

    // C. Nhập hàng loạt câu hỏi đọc hiểu từ JSON
    if (action === 'bulk_create') {
      if (!Array.isArray(bulkList) || bulkList.length === 0) {
        return NextResponse.json({ error: 'Dữ liệu nhập vào phải là một mảng JSON các câu hỏi (không được để trống)' }, { status: 400 });
      }

      const readingsToInsert: any[] = [];
      const answersMapByTempIndex: Record<number, string[]> = {};

      for (let i = 0; i < bulkList.length; i++) {
        const item = bulkList[i];
        const qText = (item.question || item.text || item.sentence || '').trim();
        const lId = item.lessonId || defaultLessonId;

        if (!qText) {
          return NextResponse.json({ error: `Câu hỏi ở phần tử #${i + 1} bị trống nội dung` }, { status: 400 });
        }
        if (!lId) {
          return NextResponse.json({ error: `Câu hỏi #${i + 1} ("${qText}") chưa được gán vào bài học nào (lessonId)` }, { status: 400 });
        }

        // Lấy danh sách đáp án
        let itemAnswers: string[] = [];
        if (Array.isArray(item.answers) && item.answers.length > 0) {
          itemAnswers = item.answers.map((a: any) => String(a).trim()).filter(Boolean);
        } else if (item.answer && String(item.answer).trim()) {
          itemAnswers = [String(item.answer).trim()];
        } else if (item.correctAnswer && String(item.correctAnswer).trim()) {
          itemAnswers = [String(item.correctAnswer).trim()];
        }

        readingsToInsert.push({
          lessonId: lId,
          question: qText,
          pinyin: (item.pinyin || '').trim(),
          vietnameseMeaning: (item.vietnameseMeaning || item.vietnamMeaning || item.meaning || item.vietnamese || '').trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        answersMapByTempIndex[readingsToInsert.length - 1] = itemAnswers;
      }

      // 1. Chèn danh sách câu hỏi vào readings
      const { data: insertedReadings, error: readInsertErr } = await supabase
        .from('readings')
        .insert(readingsToInsert)
        .select('id, question, lessonId');

      if (readInsertErr) {
        if (readInsertErr.message?.toLowerCase().includes('permission denied')) {
          return NextResponse.json({
            error: 'Lỗi phân quyền Supabase: Chưa cấp quyền cho bảng readings. Vui lòng mở file supabase_admin_security.sql, copy Mục 12 dán vào SQL Editor của Supabase và bấm RUN để cấp quyền!'
          }, { status: 403 });
        }
        throw readInsertErr;
      }

      // 2. Chèn danh sách đáp án tương ứng vào readingAnswers
      let totalAnswersInserted = 0;
      if (insertedReadings && insertedReadings.length > 0) {
        const allAnswerRows: any[] = [];

        for (let i = 0; i < insertedReadings.length; i++) {
          const createdR = insertedReadings[i];
          const ansList = answersMapByTempIndex[i] || [];
          for (const a of ansList) {
            allAnswerRows.push({
              readingId: createdR.id,
              answer: a
            });
          }
        }

        if (allAnswerRows.length > 0) {
          let { data: ansData, error: ansErr } = await supabase
            .from('readingAnswers')
            .insert(allAnswerRows)
            .select('id');

          if (ansErr) {
            // Thử cột readingid
            const payloadLower = allAnswerRows.map(a => ({
              readingid: a.readingId,
              answer: a.answer
            }));
            const retry1 = await supabase.from('readingAnswers').insert(payloadLower).select('id');
            if (!retry1.error && retry1.data) {
              totalAnswersInserted = retry1.data.length;
            } else {
              const retry2 = await supabase.from('"readingAnswers"').insert(allAnswerRows).select('id');
              if (!retry2.error && retry2.data) {
                totalAnswersInserted = retry2.data.length;
              } else {
                console.warn('Lỗi chèn readingAnswers bulk:', ansErr.message);
              }
            }
          } else if (ansData) {
            totalAnswersInserted = ansData.length;
          }
        }
      }

      const totalCount = insertedReadings ? insertedReadings.length : readingsToInsert.length;
      return NextResponse.json({
        success: true,
        count: totalCount,
        answerCount: totalAnswersInserted,
        message: `Đã nhập thành công ${totalCount} câu hỏi đọc hiểu${totalAnswersInserted > 0 ? ` và ${totalAnswersInserted} đáp án đúng` : ''} vào cơ sở dữ liệu!`
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    console.error('Lỗi API POST readings:', err);
    return NextResponse.json({ error: err.message || 'Lỗi xử lý server' }, { status: 500 });
  }
}

// 4. DELETE: Xóa câu hỏi đọc hiểu (kèm tự động xóa các đáp án liên quan)
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID câu hỏi cần xóa' }, { status: 400 });
  }

  try {
    // 1. Xóa các đáp án liên quan trong readingAnswers
    await supabase.from('readingAnswers').delete().eq('readingId', id);
    await supabase.from('readingAnswers').delete().eq('readingid', id);
    await supabase.from('"readingAnswers"').delete().eq('readingId', id);

    // 2. Xóa câu hỏi trong readings
    const { error } = await supabase
      .from('readings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Đã xóa câu hỏi đọc hiểu thành công' });
  } catch (err: any) {
    console.error('Lỗi khi xóa câu hỏi reading:', err);
    return NextResponse.json({ error: err.message || 'Lỗi khi xóa câu hỏi' }, { status: 500 });
  }
}
