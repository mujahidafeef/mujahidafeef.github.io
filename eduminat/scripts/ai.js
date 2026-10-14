// ============================================================
//  ai.js — shared AI helper for EduMinat
//  Uses Cloudflare Worker proxy. Falls back to demo mode if
//  the proxy is unavailable.
// ============================================================

const AI_CONFIG = {
    provider: 'gemini',

    // ---- Cloudflare Worker proxy ----
    // All AI calls go through this endpoint. The worker holds
    // the Gemini API key as an encrypted secret on the server.
    proxyUrl: 'https://eduminat-ai-proxy.eduminat.workers.dev',

    // ---- Optional: user-provided key (bypasses proxy) ----
    // If a user saves their own Gemini key in AI Settings,
    // we use it directly instead of the proxy.
    model: 'gemini-3.5-flash-lite', // Or the model you prefer
    apiKey: localStorage.getItem('eduminat.ai.key') || '',

    // Set to true if the proxy is down and you want to force
    // demo mode. Normally this stays false.
    forceDemoMode: false
};

// ============================================================
//  CORE — call the AI
// ============================================================
async function aiGenerate(prompt, systemInstruction = '') {
    // 1. If user provided their own key, call Gemini directly
    if (AI_CONFIG.apiKey) {
        return await callGeminiDirect(prompt, systemInstruction, AI_CONFIG.apiKey);
    }

    // 2. Otherwise, use the Cloudflare Worker proxy
    if (!AI_CONFIG.forceDemoMode) {
        try {
            return await callProxy(prompt, systemInstruction);
        } catch (err) {
            console.warn('Proxy call failed, falling back to demo mode:', err.message);
        }
    }

    // 3. Final fallback: canned demo response
    return demoFallback(prompt);
}

// ============================================================
//  CALL VIA CLOUDFLARE WORKER PROXY
// ============================================================
async function callProxy(prompt, systemInstruction = '') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let res;
    try {
        res = await fetch(AI_CONFIG.proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                systemInstruction
            }),
            signal: controller.signal
        });
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('AI request timed out');
        throw new Error('Network error: ' + err.message);
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Proxy error:', res.status, errText);
        throw new Error(`Proxy request failed (${res.status})`);
    }

    const json = await res.json();

    // The worker forwards Gemini's response verbatim
    if (json.error) {
        console.error('Proxy returned error:', json.error);
        throw new Error(json.error.message || 'AI error');
    }

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty AI response');
    return text.trim();
}

// ============================================================
//  CALL GEMINI DIRECTLY (only when user provides their own key)
// ============================================================
async function callGeminiDirect(prompt, systemInstruction = '', apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    if (systemInstruction) {
        body.systemInstruction = {
            parts: [{
                text: systemInstruction
            }]
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('AI request timed out');
        throw new Error('Network error: ' + err.message);
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
        const err = await res.text();
        console.error('Gemini API error:', err);
        throw new Error('AI request failed');
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty AI response');
    return text.trim();
}

// ============================================================
//  DEMO MODE — no key, no proxy
// ============================================================
function demoFallback(prompt) {
    return `_(AI demo mode — proxy unavailable)_

Your reflection has been saved. The AI service is temporarily unavailable, so here is a sample of what would be generated:

**Key strengths observed:** You demonstrated persistence and problem-solving under pressure.

**Growth area:** Consider documenting your learning process more consistently during future competitions.

**Recommendation:** Explore a related competition in the same category to build on this foundation.`;
}

// ============================================================
//  SETTINGS
// ============================================================
function setAiKey(key) {
    AI_CONFIG.apiKey = key || '';
    if (key) {
        localStorage.setItem('eduminat.ai.key', key);
    } else {
        localStorage.removeItem('eduminat.ai.key');
    }
}

// `hasAiKey` now means "is AI available?"
// True if either the proxy is configured OR the user has a key.
function hasAiKey() {
    return !!AI_CONFIG.apiKey || !AI_CONFIG.forceDemoMode;
}

// Report whether the user has provided their own key
// (used by the AI Settings panel to show status).
function hasUserKey() {
    return !!AI_CONFIG.apiKey;
}

// ============================================================
//  HIGH-LEVEL: REFLECTION GENERATOR
// ============================================================
async function generateReflectionReport({
    studentName,
    competitionName,
    level,
    result,
    answers
}) {
    const systemInstruction = `You are a supportive Malaysian secondary school co-curricular coach. Your job is to help students reflect meaningfully on their competition experiences. Be encouraging, specific, and actionable. Keep responses under 200 words. Use simple, clear English (or Malay if the student's answers are in Malay). Structure the response in three short sections: "What went well", "What to improve", "What's next".`;

    const answersBlock = Object.entries(answers)
        .map(([q, a]) => `Q: ${q}\nA: ${a || '(no answer)'}`)
        .join('\n\n');

    const prompt = `Student: ${studentName}
Competition: ${competitionName}
Level: ${level}
Result: ${result || 'participated'}

Reflection answers:

${answersBlock}

Please write a personalized reflection report for this student.`;

    return await aiGenerate(prompt, systemInstruction);
}

// ============================================================
//  SUGGESTED REFLECTION QUESTIONS
// ============================================================
const REFLECTION_QUESTIONS = {
    en: [{
            id: 'q1',
            text: 'What did you learn from this competition that you didn\'t know before?'
        },
        {
            id: 'q2',
            text: 'What was the most challenging moment, and how did you handle it?'
        },
        {
            id: 'q3',
            text: 'What would you do differently if you could start over?'
        },
        {
            id: 'q4',
            text: 'How did you work with others, and what role did you play in the team?'
        },
        {
            id: 'q5',
            text: 'What\'s one skill you want to improve before your next competition?'
        }
    ],
    my: [{
            id: 'q1',
            text: 'Apa yang anda pelajari daripada pertandingan ini yang anda tidak tahu sebelum ini?'
        },
        {
            id: 'q2',
            text: 'Apakah saat paling mencabar, dan bagaimana anda menghadapinya?'
        },
        {
            id: 'q3',
            text: 'Apa yang anda akan lakukan secara berbeza jika boleh bermula semula?'
        },
        {
            id: 'q4',
            text: 'Bagaimana anda bekerjasama dengan orang lain, dan apa peranan anda dalam pasukan?'
        },
        {
            id: 'q5',
            text: 'Satu kemahiran yang anda ingin tingkatkan sebelum pertandingan seterusnya?'
        }
    ]
};

// ============================================================
//  MINIMAL MARKDOWN RENDERER
// ============================================================
function markdownToHtml(md) {
    if (!md) return '';

    let html = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code style="background:#f0f0f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;">$1</code>');

    html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="margin:0.5rem 0 0.5rem 1.2rem;padding:0;">$1</ul>');

    html = html.split(/\n\n+/).map(para => {
        if (para.trim().startsWith('<ul') || para.trim().startsWith('<li')) return para;
        return `<p style="margin:0 0 0.6rem;">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}

// ============================================================
//  NATURAL LANGUAGE QUERY (KPM dashboard)
// ============================================================
const QUERY_SCHEMA_DOC = `
You translate Malaysian education-data questions into a JSON filter.

Available data:
- competitions: { name, category, level, status, date, organizerName, participants }
    - category: "STEM" | "Language" | "Arts" | "Sports"
    - level: "antarabangsa" | "kebangsaan" | "negeri" | "bahagian" | "zon_daerah"
    - status: "approved" | "pending" | "rejected" | "completed"
- students: { name, class, email, totalPajsk (computed), fromCompetitions (computed) }
    - When sorting students, use "totalPajsk" — it is the combined PAJSK score.
- reports: { competitionName, status, participants, totalPajskAwarded }

Return ONLY a JSON object (no prose, no markdown code blocks) with these possible keys:
{
  "entity":   "competitions" | "students" | "reports",
  "intent":   "count" | "list" | "sum" | "average" | "top" | "comparison",
  "filters":  { "category": "...", "level": "...", "status": "...", "class": "...", "month": "..." },
  "field":    "participants" | "totalPajskAwarded" | null,
  "limit":    number | null,
  "sortBy":   "date" | "participants" | "totalPajskAwarded" | null,
  "sortDir":  "asc" | "desc"
}

If the user speaks Malay, translate terms:
  peringkat kebangsaan → level: "kebangsaan"
  kategori STEM → category: "STEM"
  bulan Jun → month: "2026-06"
  berapa → intent: "count"
  senarai → intent: "list"
  purata → intent: "average"
  teratas → intent: "top"

Examples:
    "Berapa banyak pertandingan STEM?" → { "entity": "competitions", "intent": "count", "filters": { "category": "STEM" } }
    "List national level competitions" → { "entity": "competitions", "intent": "list", "filters": { "level": "kebangsaan" } }
    "Total participants in reports" → { "entity": "reports", "intent": "sum", "field": "participants" }
    "Top 5 students by PAJSK" → { "entity": "students", "intent": "top", "sortBy": "totalPajsk", "sortDir": "desc", "limit": 5 }
`;

async function aiQuery(question, context = {}) {
    if (!hasAiKey()) {
        return localKeywordParser(question, context);
    }

    try {
        const systemInstruction = `You are a data query translator. You output ONLY valid JSON.`;
        const prompt = `${QUERY_SCHEMA_DOC}

User question: "${question}"

Now return the JSON filter.`;

        let raw = await aiGenerate(prompt, systemInstruction);
        raw = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();

        try {
            return JSON.parse(raw);
        } catch (err) {
            console.warn('Failed to parse AI filter, falling back:', raw);
            return localKeywordParser(question, context);
        }
    } catch (err) {
        console.warn('aiQuery failed, using fallback parser:', err.message);
        return localKeywordParser(question, context);
    }
}

// ============================================================
//  FALLBACK — keyword parser
// ============================================================
function localKeywordParser(q, ctx = {}) {
    const lower = q.toLowerCase();
    const filter = {
        entity: 'competitions',
        intent: 'count',
        filters: {}
    };

    if (lower.includes('pelajar') || lower.includes('student')) filter.entity = 'students';
    if (lower.includes('laporan') || lower.includes('report')) filter.entity = 'reports';

    if (lower.includes('berapa') || lower.includes('how many') || lower.includes('count')) {
        filter.intent = 'count';
    } else if (lower.includes('senarai') || lower.includes('list') || lower.includes('show') || lower.includes('senaraikan')) {
        filter.intent = 'list';
    } else if (lower.includes('purata') || lower.includes('average') || lower.includes('avg')) {
        filter.intent = 'average';
    } else if (lower.includes('total') || lower.includes('sum') || lower.includes('jumlah')) {
        filter.intent = 'sum';
    } else if (lower.includes('teratas') || lower.includes('top')) {
        filter.intent = 'top';
        filter.limit = 5;
        if (filter.entity === 'students') {
            filter.sortBy = 'totalPajsk';
            filter.sortDir = 'desc';
        }
    }

    for (const cat of ['STEM', 'Language', 'Arts', 'Sports']) {
        if (lower.includes(cat.toLowerCase())) filter.filters.category = cat;
    }

    const levelMap = {
        'antarabangsa': 'antarabangsa',
        'international': 'antarabangsa',
        'kebangsaan': 'kebangsaan',
        'national': 'kebangsaan',
        'negeri': 'negeri',
        'state': 'negeri',
        'bahagian': 'bahagian',
        'division': 'bahagian',
        'daerah': 'zon_daerah',
        'district': 'zon_daerah',
        'zon': 'zon_daerah'
    };
    for (const [k, v] of Object.entries(levelMap)) {
        if (lower.includes(k)) {
            filter.filters.level = v;
            break;
        }
    }

    const statusMap = {
        'approved': 'approved',
        'diluluskan': 'approved',
        'lulus': 'approved',
        'pending': 'pending',
        'menunggu': 'pending',
        'rejected': 'rejected',
        'ditolak': 'rejected',
        'tolak': 'rejected',
        'completed': 'completed',
        'tamat': 'completed',
        'selesai': 'completed',
        'siap': 'completed'
    };
    for (const [k, v] of Object.entries(statusMap)) {
        if (lower.includes(k)) {
            filter.filters.status = v;
            break;
        }
    }

    return filter;
}

// ============================================================
//  EXECUTE THE FILTER AGAINST IndexedDB
// ============================================================
async function executeQuery(filter, ctx = {}) {
    const {
        entity = 'competitions', intent = 'count', filters = {},
            field = null, limit = null, sortBy = null, sortDir = 'desc'
    } = filter;

    let rows = [];

    if (entity === 'competitions') {
        rows = await Competitions.all();
    } else if (entity === 'students') {
        const rawStudents = await Users.byRole('student');
        rows = [];
        for (const s of rawStudents) {
            const p = await calculatePajsk(s.email);
            rows.push({
                ...s,
                totalPajsk: p.total,
                fromCompetitions: p.fromCompetitions
            });
        }
    } else if (entity === 'reports') {
        rows = await Reports.all();
    }

    if (filters.category) rows = rows.filter(r => (r.category || '').toLowerCase() === filters.category.toLowerCase());
    if (filters.level) rows = rows.filter(r => r.level === filters.level);
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    if (filters.class) rows = rows.filter(r => (r.class || '').toLowerCase() === filters.class.toLowerCase());
    if (filters.month) rows = rows.filter(r => (r.date || r.submittedAt || '').toString().startsWith(filters.month));

    if (sortBy) {
        let actualSortBy = sortBy;
        if (entity === 'students') {
            if (sortBy === 'totalPajskAwarded' || sortBy === 'pajsk' || sortBy === 'marks') {
                actualSortBy = 'totalPajsk';
            }
        }

        rows.sort((a, b) => {
            const av = a[actualSortBy];
            const bv = b[actualSortBy];
            if (av === undefined && bv === undefined) return 0;
            if (av === undefined) return 1;
            if (bv === undefined) return -1;
            if (sortDir === 'asc') return av > bv ? 1 : -1;
            return av < bv ? 1 : -1;
        });
    }

    if (limit && limit > 0) rows = rows.slice(0, limit);

    if (intent === 'count') {
        return {
            count: rows.length
        };
    } else if (intent === 'sum') {
        const f = field || 'participants';
        const total = rows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
        return {
            total,
            field: f,
            rows: rows.length
        };
    } else if (intent === 'average') {
        const f = field || 'totalPajskAwarded';
        const vals = rows.map(r => Number(r[f]) || 0);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return {
            average: avg,
            field: f,
            rows: rows.length
        };
    } else if (intent === 'top' || intent === 'list') {
        return {
            rows: rows.slice(0, limit || 10),
            count: rows.length,
            total: rows.length
        };
    }
    return {
        rows,
        count: rows.length
    };
}

// ============================================================
//  ANSWER — turn the result into a natural-language sentence
// ============================================================
async function aiAnswer(question, filter, result, lang = 'my') {
    if (!hasAiKey()) return fallbackAnswer(result, lang);

    try {
        const langName = lang === 'en' ? 'English' : 'Bahasa Melayu';
        const systemInstruction = `You are a helpful assistant for the Malaysian Ministry of Education (KPM). Answer questions about their education data. Reply in ${langName}. Be concise — 1-2 sentences. Use numbers from the data.`;

        const prompt = `User asked: "${question}"

Filter used: ${JSON.stringify(filter)}
Result: ${JSON.stringify(result)}

Write a 1-2 sentence answer in ${langName}.`;

        return await aiGenerate(prompt, systemInstruction);
    } catch (err) {
        console.warn('aiAnswer failed:', err.message);
        return fallbackAnswer(result, lang);
    }
}

function fallbackAnswer(result, lang) {
    const isEN = lang === 'en';

    if (Array.isArray(result.rows) && result.rows.length > 0) {
        const total = result.count ?? result.rows.length;
        const shown = result.rows.length;
        return isEN ?
            `Found ${total} matches. Showing the first ${shown}.` :
            `Ditemui ${total} padanan. Memaparkan ${shown} pertama.`;
    }

    if (result.count !== undefined && !result.rows) {
        return isEN ? `There are ${result.count} matching records.` : `Terdapat ${result.count} rekod yang sepadan.`;
    }
    if (result.total !== undefined && result.field) {
        return isEN ? `The total ${result.field} is ${result.total}.` : `Jumlah ${result.field} ialah ${result.total}.`;
    }
    if (result.average !== undefined) {
        return isEN ? `The average ${result.field} is ${result.average.toFixed(1)}.` : `Purata ${result.field} ialah ${result.average.toFixed(1)}.`;
    }
    return isEN ? 'Here are the results.' : 'Berikut adalah hasilnya.';
}

// ============================================================
//  END-TO-END
// ============================================================
async function aiNaturalQuery(question, lang = 'my') {
    const filter = await aiQuery(question);
    const result = await executeQuery(filter);
    const answer = await aiAnswer(question, filter, result, lang);
    return {
        filter,
        result,
        answer
    };
}

// ============================================================
//  AI COMPETITION RECOMMENDATIONS (Student dashboard)
// ============================================================
async function aiRecommendCompetitions(studentEmail, lang = 'my') {
    const student = await Users.get(studentEmail);
    if (!student) return [];

    const allApproved = await Competitions.byStatus('approved');
    const myRegs = await Registrations.byStudent(studentEmail);
    const myMarks = await Marks.byStudent(studentEmail);
    const registeredIds = myRegs.map(r => r.competitionId);

    const available = allApproved.filter(c => !registeredIds.includes(c.id));
    if (available.length === 0) return [];

    const completedRegs = myRegs.filter(r => r.status === 'completed');
    const categoryCount = {};
    const levelCount = {};

    for (const r of completedRegs) {
        const c = allApproved.find(x => x.id === r.competitionId) ||
            (await Competitions.get(r.competitionId));
        if (!c) continue;
        categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
        levelCount[c.level] = (levelCount[c.level] || 0) + 1;
    }

    const pajskData = await calculatePajsk(studentEmail);

    if (hasAiKey()) {
        try {
            const langName = lang === 'en' ? 'English' : 'Bahasa Melayu';

            const history = {
                studentName: student.name,
                class: student.class,
                totalPajsk: pajskData.total,
                completedCount: completedRegs.length,
                categoriesTried: Object.keys(categoryCount),
                levelsTried: Object.keys(levelCount),
                topResults: myMarks
                    .filter(m => ['johan', 'naib_johan', 'ketiga'].includes(m.result))
                    .map(m => ({
                        name: m.competitionName,
                        result: m.result,
                        level: m.level
                    }))
            };

            const candidates = available.slice(0, 30).map(c => ({
                id: c.id,
                name: c.name,
                category: c.category,
                level: c.level,
                date: c.date,
                description: c.description
            }));

            const systemInstruction = `You are a supportive Malaysian secondary school co-curricular advisor. Your job is to recommend competitions that broaden a student's experience and help them grow. Reply in ${langName}. Return ONLY valid JSON — no markdown, no prose.`;

            const prompt = `Student profile:
${JSON.stringify(history, null, 2)}

Available competitions to recommend from:
${JSON.stringify(candidates, null, 2)}

Pick the 9 BEST recommendations. Consider:
1. Broaden exposure — suggest categories the student hasn't tried
2. Stretch — if they've succeeded at lower levels, suggest higher levels
3. Balance — mix a safe bet with a challenging option

Return ONLY this JSON shape:
[
  { "id": <competition_id>, "reason": "<1 short sentence why this fits>" },
  { "id": <competition_id>, "reason": "<reason>" },
  { "id": <competition_id>, "reason": "<reason>" },
  { "id": <competition_id>, "reason": "<reason>" },
  { "id": <competition_id>, "reason": "<reason>" },
  { "id": <competition_id>, "reason": "<reason>" },
  { "id": <competition_id>, "reason": "<reason>" },
  { "id": <competition_id>, "reason": "<reason>" },
  { "id": <competition_id>, "reason": "<reason>" }
]`;

            let raw = await aiGenerate(prompt, systemInstruction);
            raw = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed
                    .map(p => {
                        const comp = available.find(c => c.id === p.id);
                        return comp ? {
                            competition: comp,
                            reason: p.reason
                        } : null;
                    })
                    .filter(Boolean)
                    .slice(0, 9);
            }
        } catch (err) {
            console.warn('AI recommendation failed, using rule-based:', err.message);
        }
    }

    return ruleBasedRecommendations({
        student,
        available,
        categoryCount,
        levelCount,
        completedRegs,
        lang
    });
}

function ruleBasedRecommendations({
    student,
    available,
    categoryCount,
    levelCount,
    completedRegs,
    lang
}) {
    const isEN = lang === 'en';
    const picks = [];
    const usedIds = new Set();

    const levelRank = {
        zon_daerah: 1,
        bahagian: 2,
        negeri: 3,
        kebangsaan: 4,
        antarabangsa: 5
    };

    const triedCategories = Object.keys(categoryCount);
    const allCategories = ['STEM', 'Language', 'Arts', 'Sports'];
    const untriedCategories = allCategories.filter(c => !triedCategories.includes(c));

    if (untriedCategories.length > 0 && picks.length < 3) {
        for (const cat of untriedCategories) {
            const candidate = available.find(c => c.category === cat && !usedIds.has(c.id));
            if (candidate) {
                picks.push({
                    competition: candidate,
                    reason: isEN ?
                        `You haven't tried ${cat} yet — this is a good chance to broaden your experience.` :
                        `Anda belum mencuba ${cat} — ini peluang baik untuk meluaskan pengalaman.`
                });
                usedIds.add(candidate.id);
                break;
            }
        }
    }

    if (picks.length < 3 && completedRegs.length > 0) {
        const highestLevelDone = Math.max(
            ...completedRegs.map(r => {
                const c = available.find(x => x.id === r.competitionId);
                return c ? (levelRank[c.level] || 0) : 0;
            }),
            0
        );
        const stretch = available.find(c => !usedIds.has(c.id) && (levelRank[c.level] || 0) > highestLevelDone);
        if (stretch) {
            picks.push({
                competition: stretch,
                reason: isEN ?
                    `A step up to ${stretch.level} level — you're ready for this challenge.` :
                    `Langkah ke peringkat ${stretch.level} — anda sudah bersedia untuk cabaran ini.`
            });
            usedIds.add(stretch.id);
        }
    }

    const remaining = available
        .filter(c => !usedIds.has(c.id))
        .sort((a, b) => {
            const aMax = a.participationScore + (a.maxAchievementScore || 0);
            const bMax = b.participationScore + (b.maxAchievementScore || 0);
            return bMax - aMax;
        });

    for (const c of remaining) {
        if (picks.length >= 3) break;
        picks.push({
            competition: c,
            reason: isEN ?
                `Strong option — up to ${c.participationScore + (c.maxAchievementScore || 0)} PAJSK marks available.` :
                `Pilihan kukuh — sehingga ${c.participationScore + (c.maxAchievementScore || 0)} mata PAJSK tersedia.`
        });
        usedIds.add(c.id);
    }

    return picks;
}

// ============================================================
//  AI PARENT SUMMARY
// ============================================================
async function aiParentSummary(studentEmail, lang = 'my') {
    const student = await Users.get(studentEmail);
    if (!student) return null;

    const regs = await Registrations.byStudent(studentEmail);
    const marks = await Marks.byStudent(studentEmail);
    const pajskData = await calculatePajsk(studentEmail);
    const reflections = await Reflections.byStudent(studentEmail);

    const completedRegs = regs.filter(r => r.status === 'completed');
    const activeRegs = regs.filter(r => r.status === 'registered' || r.status === 'ongoing');

    const categoryWins = {};
    const levelWins = {};
    const results = [];

    for (const m of marks) {
        if (m.competitionName) {
            const comp = await Competitions.get(m.competitionId);
            const c = comp?.category || 'Other';
            categoryWins[c] = (categoryWins[c] || 0) + 1;
        }
        levelWins[m.level] = (levelWins[m.level] || 0) + 1;
        if (m.result) results.push({
            name: m.competitionName,
            result: m.result,
            level: m.level
        });
    }

    const topResults = results.filter(r => ['johan', 'naib_johan', 'ketiga'].includes(r.result)).slice(0, 3);

    if (hasAiKey()) {
        try {
            const langName = lang === 'en' ? 'English' : 'Bahasa Melayu';

            const profile = {
                studentName: student.name,
                studentClass: student.class,
                totalPajsk: pajskData.total,
                basePajsk: pajskData.base,
                competitionPajsk: pajskData.fromCompetitions,
                completedCount: completedRegs.length,
                activeCount: activeRegs.length,
                categoriesTried: Object.keys(categoryWins),
                levelsTried: Object.keys(levelWins),
                topResults,
                recentReflections: reflections.slice(0, 2).map(r => ({
                    competition: r.competitionName,
                    insightExcerpt: (r.insights || '').slice(0, 200)
                }))
            };

            const systemInstruction = `You are a warm, professional Malaysian school advisor writing a progress summary for a parent about their child. Be encouraging but honest. Reply in ${langName}. Structure the response in EXACTLY three short sections with these bold headings on their own lines:
**Perkembangan Positif:** (or **What's going well:** in English)
**Perlu Perhatian:** (or **What to watch:**)
**Cadangan Seterusnya:** (or **What to encourage next:**)
Each section should be 1-2 sentences. Keep the total under 180 words.`;

            const prompt = `Student progress data:
${JSON.stringify(profile, null, 2)}

Write the parent summary now.`;

            const raw = await aiGenerate(prompt, systemInstruction);
            return {
                summary: raw,
                aiGenerated: true,
                generatedAt: Date.now()
            };
        } catch (err) {
            console.warn('AI parent summary failed, using template:', err.message);
        }
    }

    return {
        summary: templateParentSummary({
            student,
            pajskData,
            completedRegs,
            activeRegs,
            categoryWins,
            levelWins,
            topResults,
            lang
        }),
        aiGenerated: false,
        generatedAt: Date.now()
    };
}

function templateParentSummary({
    student,
    pajskData,
    completedRegs,
    activeRegs,
    categoryWins,
    levelWins,
    topResults,
    lang
}) {
    const isEN = lang === 'en';
    const firstName = student.name.split(' ')[0];

    const categories = Object.keys(categoryWins);
    const strongestCat = categories.sort((a, b) => categoryWins[b] - categoryWins[a])[0];
    const wins = topResults.length;

    let p1;
    if (wins >= 2) {
        p1 = isEN ?
            `**What's going well:** ${firstName} has earned top placements in ${wins} competitions — a strong record. Their total PAJSK of ${pajskData.total.toFixed(1)} reflects consistent effort across events.` :
            `**Perkembangan Positif:** ${firstName} telah memperoleh tempat teratas dalam ${wins} pertandingan — satu rekod yang kukuh. Jumlah PAJSK ${pajskData.total.toFixed(1)} mencerminkan usaha yang konsisten.`;
    } else if (completedRegs.length > 0) {
        p1 = isEN ?
            `**What's going well:** ${firstName} has completed ${completedRegs.length} competition${completedRegs.length > 1 ? 's' : ''}, building steady experience${strongestCat ? ` — with a focus on ${strongestCat}` : ''}.` :
            `**Perkembangan Positif:** ${firstName} telah menyelesaikan ${completedRegs.length} pertandingan, membina pengalaman secara berterusan${strongestCat ? ` — dengan tumpuan pada ${strongestCat}` : ''}.`;
    } else {
        p1 = isEN ?
            `**What's going well:** ${firstName} is registered and ready to begin their competition journey. The base PAJSK is a good foundation to build on.` :
            `**Perkembangan Positif:** ${firstName} telah berdaftar dan bersedia memulakan perjalanan pertandingan. PAJSK asas adalah permulaan yang baik.`;
    }

    let p2;
    const levelCount = Object.keys(levelWins).length;
    if (completedRegs.length > 0 && levelCount === 1) {
        const onlyLevel = Object.keys(levelWins)[0];
        p2 = isEN ?
            `**What to watch:** All competitions so far have been at the ${onlyLevel} level. Exploring a higher tier would broaden their growth.` :
            `**Perlu Perhatian:** Semua pertandingan setakat ini berada di peringkat ${onlyLevel}. Meneroka peringkat lebih tinggi akan meluaskan lagi perkembangan.`;
    } else if (activeRegs.length > 3) {
        p2 = isEN ?
            `**What to watch:** ${firstName} is currently registered for ${activeRegs.length} competitions. Balance is important — make sure studies aren't neglected.` :
            `**Perlu Perhatian:** ${firstName} kini berdaftar untuk ${activeRegs.length} pertandingan. Keseimbangan penting — pastikan pelajaran tidak diabaikan.`;
    } else if (categories.length < 2) {
        p2 = isEN ?
            `**What to watch:** ${firstName} has focused on one area. Trying a different category would build a more balanced portfolio.` :
            `**Perlu Perhatian:** ${firstName} telah memberi tumpuan pada satu bidang. Mencuba kategori berbeza akan membina portfolio yang lebih seimbang.`;
    } else {
        p2 = isEN ?
            `**What to watch:** Progress is steady. Keep an eye on consistency — regular participation matters more than isolated wins.` :
            `**Perlu Perhatian:** Kemajuan berterusan. Pantau konsistensi — penyertaan berterusan lebih penting daripada kemenangan terpencil.`;
    }

    const suggestions = [];
    if (!categories.includes('STEM')) suggestions.push(isEN ? 'a STEM competition' : 'pertandingan STEM');
    if (!categories.includes('Arts')) suggestions.push(isEN ? 'an arts event' : 'acara seni');
    if (!categories.includes('Language')) suggestions.push(isEN ? 'a language competition' : 'pertandingan bahasa');
    if (!categories.includes('Sports')) suggestions.push(isEN ? 'a sports event' : 'acara sukan');

    let p3;
    if (suggestions.length > 0) {
        p3 = isEN ?
            `**What to encourage next:** Consider encouraging ${firstName} to try ${suggestions.slice(0, 2).join(' or ')}.` :
            `**Cadangan Seterusnya:** Pertimbangkan untuk menggalakkan ${firstName} mencuba ${suggestions.slice(0, 2).join(' atau ')}.`;
    } else {
        p3 = isEN ?
            `**What to encourage next:** ${firstName} has a well-rounded profile. Keep supporting their participation — consistency is what builds the strongest records.` :
            `**Cadangan Seterusnya:** ${firstName} mempunyai profil yang seimbang. Teruskan sokongan — konsistensi membina rekod terbaik.`;
    }

    return `${p1}\n\n${p2}\n\n${p3}`;
}

// ============================================================
//  AI COMPETITION DESCRIPTION GENERATOR (Organizer)
// ============================================================
async function aiGenerateCompetitionDescription({
    name,
    category,
    level,
    engagementType,
    keywords = '',
    lang = 'my'
}) {
    const levelLabel = (window.DB && DB.levelLabel) ? DB.levelLabel(level) : level;
    const engagementLabel = (window.DB && DB.engagementLabel) ? DB.engagementLabel(engagementType) : engagementType;

    if (hasAiKey()) {
        try {
            const langName = lang === 'en' ? 'English' : 'Bahasa Melayu';
            const systemInstruction = `You are a Malaysian school co-curricular coordinator writing a competition description for a national education platform. Write in ${langName}. Be clear, professional, encouraging to students. Keep it under 120 words, 2 short paragraphs. Do NOT use markdown headings, bold, or bullet points — just plain prose paragraphs.`;

            const prompt = `Write a competition description.

Competition details:
- Name: ${name || '(untitled)'}
- Category: ${category}
- Level: ${levelLabel}
- Engagement type: ${engagementLabel}
- Extra keywords from organizer: ${keywords || '(none)'}

Write 2 short paragraphs:
1. What the competition is and who it's for
2. What participants will gain — skills, exposure, recognition

Plain prose only. No headings, no bullet points, no markdown.`;

            const raw = await aiGenerate(prompt, systemInstruction);
            if (raw && raw.trim().length > 30) {
                return {
                    text: raw.trim(),
                    aiGenerated: true
                };
            }
        } catch (err) {
            console.warn('AI description generation failed, using template:', err.message);
        }
    }

    return {
        text: templateCompetitionDescription({
            name,
            category,
            level: levelLabel,
            engagementType: engagementLabel,
            keywords,
            lang
        }),
        aiGenerated: false
    };
}

function templateCompetitionDescription({
    name,
    category,
    level,
    engagementType,
    keywords,
    lang
}) {
    const isEN = lang === 'en';
    const n = name || (isEN ? 'This competition' : 'Pertandingan ini');
    const kw = (keywords || '').trim();

    if (isEN) {
        const kwLine = kw ? ` The event will focus on ${kw}, giving participants hands-on exposure to real-world challenges.` : '';
        return `${n} is a ${level.toLowerCase()}-level ${category} competition open to secondary school students across Malaysia.${kwLine} Participants will develop critical thinking, teamwork, and presentation skills, and earn PAJSK credit under the KPM framework.

Whether you're a first-timer or a seasoned competitor, this is a valuable opportunity to grow, learn from peers, and gain recognition at the ${level.toLowerCase()} stage.`;
    }

    const kwLine = kw ? ` Pertandingan ini akan memberi tumpuan kepada ${kw}, memberikan peserta pengalaman langsung dengan cabaran dunia sebenar.` : '';
    return `${n} ialah pertandingan ${category} peringkat ${level.toLowerCase()} yang terbuka kepada pelajar sekolah menengah di seluruh Malaysia.${kwLine} Peserta akan membangunkan kemahiran berfikir secara kritis, kerja berpasukan, dan penyampaian, serta memperoleh kredit PAJSK di bawah kerangka KPM.

Sama ada anda peserta kali pertama atau berpengalaman, ini peluang berharga untuk berkembang, belajar daripada rakan sebaya, dan mendapat pengiktirafan di peringkat ${level.toLowerCase()}.`;
}

// ============================================================
//  AI CLASS INSIGHT (Teacher dashboard)
// ============================================================
async function aiClassInsight(classFilter, lang = 'my') {
    const allStudents = await Users.byRole('student');
    const allComps = await Competitions.all();
    const allRegs = await Registrations.all();

    const students = classFilter === 'all' ?
        allStudents :
        allStudents.filter(s => s.class === classFilter);

    if (students.length === 0) return null;

    const rows = [];
    for (const s of students) {
        const p = await calculatePajsk(s.email);
        const regs = allRegs.filter(r => r.studentEmail === s.email);
        const active = regs.filter(r => r.status === 'registered' || r.status === 'ongoing').length;
        const completed = regs.filter(r => r.status === 'completed').length;
        rows.push({
            student: s,
            pajsk: p.total,
            active,
            completed,
            regs
        });
    }

    const classAvg = rows.reduce((s, r) => s + r.pajsk, 0) / rows.length;

    let schoolTotal = 0;
    for (const s of allStudents) {
        const p = await calculatePajsk(s.email);
        schoolTotal += p.total;
    }
    const schoolAvg = allStudents.length ? schoolTotal / allStudents.length : 0;

    const activeCount = rows.filter(r => r.active > 0).length;
    const completedCount = rows.filter(r => r.completed > 0).length;
    const inactiveStudents = rows.filter(r => r.active === 0 && r.completed === 0);

    const categoryCounts = {};
    for (const r of rows) {
        for (const reg of r.regs) {
            const comp = allComps.find(c => c.id === reg.competitionId);
            if (!comp) continue;
            categoryCounts[comp.category] = (categoryCounts[comp.category] || 0) + 1;
        }
    }

    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
    const strongestCategory = sortedCategories[0] || null;
    const weakestCategories = ['STEM', 'Language', 'Arts', 'Sports'].filter(c => !categoryCounts[c] || categoryCounts[c] < 2);
    const topStudent = [...rows].sort((a, b) => b.pajsk - a.pajsk)[0];

    if (hasAiKey()) {
        try {
            const langName = lang === 'en' ? 'English' : 'Bahasa Melayu';
            const profile = {
                className: classFilter === 'all' ? 'All Classes' : classFilter,
                studentCount: students.length,
                classAvgPajsk: Number(classAvg.toFixed(1)),
                schoolAvgPajsk: Number(schoolAvg.toFixed(1)),
                activeStudents: activeCount,
                completedStudents: completedCount,
                inactiveStudents: inactiveStudents.map(s => s.student.name),
                categoryEngagement: categoryCounts,
                strongestCategory,
                weakestCategories,
                topStudent: topStudent ? {
                    name: topStudent.student.name,
                    pajsk: topStudent.pajsk
                } : null
            };

            const systemInstruction = `You are a supportive Malaysian school co-curricular coordinator writing a brief class performance analysis for a teacher. Reply in ${langName}. Write EXACTLY three short paragraphs, no headings, no bullet points, no markdown. Keep the total under 160 words. Be specific, use the numbers provided, and end with one concrete suggestion.`;

            const prompt = `Class performance data:
${JSON.stringify(profile, null, 2)}

Write a 3-paragraph analysis for the teacher.`;

            const raw = await aiGenerate(prompt, systemInstruction);
            if (raw && raw.trim().length > 40) {
                return {
                    text: raw.trim(),
                    aiGenerated: true
                };
            }
        } catch (err) {
            console.warn('AI class insight failed, using template:', err.message);
        }
    }

    return {
        text: templateClassInsight({
            classFilter,
            students,
            rows,
            classAvg,
            schoolAvg,
            activeCount,
            completedCount,
            inactiveStudents,
            strongestCategory,
            weakestCategories,
            topStudent,
            lang
        }),
        aiGenerated: false
    };
}

function templateClassInsight({
    classFilter,
    students,
    rows,
    classAvg,
    schoolAvg,
    activeCount,
    completedCount,
    inactiveStudents,
    strongestCategory,
    weakestCategories,
    topStudent,
    lang
}) {
    const isEN = lang === 'en';
    const className = classFilter === 'all' ? (isEN ? 'All Classes' : 'Semua Kelas') : classFilter;
    const diff = (classAvg - schoolAvg).toFixed(1);
    const diffLabel = parseFloat(diff) >= 0 ?
        (isEN ? `${diff} points above` : `${diff} mata di atas`) :
        (isEN ? `${Math.abs(diff)} points below` : `${Math.abs(diff)} mata di bawah`);

    let p1;
    if (isEN) {
        p1 = `${className} has ${students.length} students with an average PAJSK of ${classAvg.toFixed(1)}, which is ${diffLabel} the school-wide average of ${schoolAvg.toFixed(1)}.`;
        if (topStudent) p1 += ` ${topStudent.student.name} leads the class with ${topStudent.pajsk.toFixed(1)} PAJSK.`;
    } else {
        p1 = `${className} mempunyai ${students.length} pelajar dengan purata PAJSK ${classAvg.toFixed(1)}, iaitu ${diffLabel} purata sekolah ${schoolAvg.toFixed(1)}.`;
        if (topStudent) p1 += ` ${topStudent.student.name} mendahului kelas dengan ${topStudent.pajsk.toFixed(1)} PAJSK.`;
    }

    let p2;
    if (isEN) {
        p2 = `${activeCount} students are currently active in competitions, and ${completedCount} have completed at least one event. `;
        if (strongestCategory) p2 += `Engagement is strongest in ${strongestCategory}. `;
        if (weakestCategories.length > 0) p2 += `There is less activity in ${weakestCategories.slice(0, 2).join(' and ')}.`;
    } else {
        p2 = `${activeCount} pelajar aktif dalam pertandingan, dan ${completedCount} telah menyelesaikan sekurang-kurangnya satu acara. `;
        if (strongestCategory) p2 += `Penglibatan paling kukuh dalam ${strongestCategory}. `;
        if (weakestCategories.length > 0) p2 += `Kurang aktiviti dalam ${weakestCategories.slice(0, 2).join(' dan ')}.`;
    }

    let p3;
    if (inactiveStudents.length === 0) {
        p3 = isEN ?
            `Every student is participating in at least one activity — excellent engagement. Consider nominating a few for higher-level competitions next term.` :
            `Setiap pelajar menyertai sekurang-kurangnya satu aktiviti — penglibatan cemerlang. Pertimbangkan mencalonkan beberapa untuk pertandingan peringkat lebih tinggi.`;
    } else {
        const names = inactiveStudents.slice(0, 2).map(s => s.student.name).join(', ');
        const more = inactiveStudents.length > 2 ?
            (isEN ? ` and ${inactiveStudents.length - 2} more` : ` dan ${inactiveStudents.length - 2} lagi`) :
            '';
        p3 = isEN ?
            `${inactiveStudents.length} student${inactiveStudents.length > 1 ? 's' : ''} (${names}${more}) haven't participated yet. Consider a low-barrier entry event like a school-level or district-level competition to re-engage them.` :
            `${inactiveStudents.length} pelajar (${names}${more}) belum menyertai sebarang aktiviti. Pertimbangkan acara peringkat sekolah atau daerah sebagai permulaan untuk menarik minat mereka.`;
    }

    return `${p1}\n\n${p2}\n\n${p3}`;
}

async function testAiConnection() {
    try {
        const res = await aiGenerate('Say "OK" if you can read this.');
        return {
            ok: true,
            response: res
        };
    } catch (err) {
        return {
            ok: false,
            error: err.message
        };
    }
}

// ============================================================
//  EXPOSE
// ============================================================
window.AI = {
    aiGenerate,
    setAiKey,
    hasAiKey,
    hasUserKey,
    generateReflectionReport,
    REFLECTION_QUESTIONS,
    AI_CONFIG,
    markdownToHtml,
    aiQuery,
    executeQuery,
    aiAnswer,
    aiNaturalQuery,
    aiRecommendCompetitions,
    aiParentSummary,
    aiGenerateCompetitionDescription,
    aiClassInsight,
    testAiConnection
};