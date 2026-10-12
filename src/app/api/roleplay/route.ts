import { NextRequest, NextResponse } from 'next/server';

type ChatMessage = { role: 'user' | 'ai'; text: string };

// Thử lần lượt các model; nếu model bị quá tải (503) hoặc ngừng hỗ trợ (404) sẽ chuyển sang model kế tiếp
const MODELS = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest'
];

const MODEL_TIMEOUT_MS = 25000;

const LEVEL_GUIDE: Record<string, string> = {
  beginner: 'TOCFL Band A (beginner). Use very short, simple sentences (max ~12 characters each), only basic everyday vocabulary.',
  intermediate: 'TOCFL Band B (intermediate). Use natural sentences of moderate length with common vocabulary and some connectors.',
  advanced: 'TOCFL Band C (advanced). Use rich, natural, idiomatic Taiwanese Mandarin with advanced vocabulary.'
};

const LANG_NAME: Record<string, string> = {
  vi: 'Vietnamese',
  en: 'English',
  id: 'Indonesian'
};

function buildSystemPrompt(topic: string, partner: string, level: string, lang: string) {
  const langName = LANG_NAME[lang] || 'Vietnamese';
  return `You are a friendly AI Mandarin Chinese tutor doing a ROLEPLAY conversation with a learner preparing for TOCFL (Taiwan).
SCENARIO: "${topic}"
YOUR ROLE: You play "${partner}". The learner plays the other side of the conversation.
LEVEL: ${LEVEL_GUIDE[level] || LEVEL_GUIDE.beginner}

RULES:
- Always speak in Taiwanese Mandarin using TRADITIONAL Chinese characters (繁體字), stay fully in character.
- Keep each reply short (1-3 sentences) and end with something that invites the learner to respond.
- If the learner writes in another language or makes Chinese mistakes, gently correct them in the "correction" field (explanations in ${langName}). If the learner's message has no mistakes, set "correction" to null.
- Provide exactly 3 short suggested replies the learner could say next (in Traditional Chinese, matching the level).
- Extract 1-3 key vocabulary words or idioms from this turn's reply that are important for the learner to know: { "word": string (繁體字), "pinyin": string, "meaning": string }
- All translations and explanations must be in ${langName}.
- Pinyin must use tone marks (e.g. nǐ hǎo).

Respond ONLY with JSON matching this schema:
{
  "reply": { "hanzi": string, "pinyin": string, "translation": string },
  "correction": null | { "original": string, "corrected": string, "pinyin": string, "explanation": string },
  "suggestions": [ { "hanzi": string, "pinyin": string, "translation": string } ],
  "keyVocabulary": [ { "word": string, "pinyin": string, "meaning": string } ]
}
`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const topic: string = (body.topic || '').toString().slice(0, 200);
  const partner: string = (body.partner || '').toString().slice(0, 100);
  const level: string = body.level || 'beginner';
  const lang: string = body.lang || 'vi';
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-30) : [];

  if (!topic || !partner) {
    return NextResponse.json({ error: 'Missing topic or partner' }, { status: 400 });
  }

  // Gemini requires the conversation to start with a user turn
  const contents: any[] = [
    {
      role: 'user',
      parts: [{ text: messages.length === 0
        ? '[START] Please open the conversation in character with a greeting that fits the scenario.'
        : '[START] Begin the roleplay.' }]
    }
  ];
  for (const m of messages) {
    contents.push({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: (m.text || '').toString().slice(0, 1000) }]
    });
  }

  const payload = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(topic, partner, level, lang) }] },
    contents,
    generationConfig: {
      temperature: 0.8,
      responseMimeType: 'application/json'
    }
  };

  let lastError = 'Unknown error';
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(MODEL_TIMEOUT_MS)
        }
      );

      if (!res.ok) {
        lastError = `${model}: ${res.status} ${await res.text()}`;
        continue;
      }

      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      const cleaned = text.replace(/^```json\s*|```$/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        reply: parsed.reply || { hanzi: '', pinyin: '', translation: '' },
        correction: parsed.correction || null,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
        keyVocabulary: Array.isArray(parsed.keyVocabulary) ? parsed.keyVocabulary : []
      });
    } catch (err: any) {
      lastError = `${model}: ${err?.message || err}`;
    }
  }

  console.error('[roleplay] Gemini error:', lastError);
  return NextResponse.json({ error: 'AI is unavailable right now' }, { status: 502 });
}
