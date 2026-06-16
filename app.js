// ScamChecker — app.js
// Logic: OpenAI streaming, render kết quả, localStorage

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
let withPsych  = false;
let analyzing  = false;
let history    = JSON.parse(localStorage.getItem('sc_history') || '[]');

const RISK_LABELS = {
  safe:     'AN TOÀN',
  low:      'RỦI RO THẤP',
  medium:   'ĐÁNG NGỜ',
  high:     'NGUY HIỂM',
  critical: 'CỰC KỲ NGUY HIỂM',
};

// ═══════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════
function initTheme() {
  const t = localStorage.getItem('sc_theme') || 'dark';
  applyTheme(t);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}

function applyTheme(t) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  localStorage.setItem('sc_theme', t);
  const sun   = document.getElementById('theme-icon-sun');
  const moon  = document.getElementById('theme-icon-moon');
  const label = document.getElementById('theme-label');
  if (t === 'dark') {
    sun.style.display  = '';
    moon.style.display = 'none';
    label.textContent  = 'Sáng';
  } else {
    sun.style.display  = 'none';
    moon.style.display = '';
    label.textContent  = 'Tối';
  }
}

// ═══════════════════════════════════════════════
// API Key
// ═══════════════════════════════════════════════
function initApiKey() {
  const stored = localStorage.getItem('sc_apikey');
  if (stored) {
    document.getElementById('api-key-input').value = stored;
    document.getElementById('apikey-saved').style.display = 'block';
  }
  // If config.js was loaded with a valid key, hide the input box
  if (typeof CONFIG !== 'undefined' && CONFIG.OPENAI_API_KEY && !CONFIG.OPENAI_API_KEY.startsWith('sk-REPLACE')) {
    document.getElementById('apikey-box').style.display = 'none';
  }
}

function saveApiKey() {
  const k = document.getElementById('api-key-input').value.trim();
  if (!k) return;
  localStorage.setItem('sc_apikey', k);
  document.getElementById('apikey-saved').style.display = 'block';
}

function getApiKey() {
  // Priority: config.js > localStorage > UI input
  if (typeof CONFIG !== 'undefined' && CONFIG.OPENAI_API_KEY && !CONFIG.OPENAI_API_KEY.startsWith('sk-REPLACE')) {
    return CONFIG.OPENAI_API_KEY;
  }
  return localStorage.getItem('sc_apikey') || document.getElementById('api-key-input').value.trim();
}

// ═══════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════
function showPage(page) {
  ['analyze', 'history', 'stats'].forEach(p => {
    document.getElementById('page-' + p).classList.toggle('active', p === page);
    document.getElementById('nav-' + p).classList.toggle('active', p === page);
  });
  if (page === 'history') renderHistory();
  if (page === 'stats')   renderStats();
}

// ═══════════════════════════════════════════════
// Psychologist toggle
// ═══════════════════════════════════════════════
function togglePsych() {
  withPsych = !withPsych;
  document.getElementById('psych-toggle').classList.toggle('on', withPsych);
  document.getElementById('toggle-track').classList.toggle('on', withPsych);
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════
function escHtml(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function highlight(text, keywords) {
  if (!keywords) return escHtml(text);
  const kws = keywords.split(',').map(k => k.trim()).filter(Boolean);
  if (!kws.length) return escHtml(text);
  const re = new RegExp(
    '(' + kws.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
    'gi'
  );
  return escHtml(text).replace(re, '<mark>$1</mark>');
}

function gaugeColor(s) {
  return s >= 80 ? '#f87171' : s >= 60 ? '#fb923c' : s >= 40 ? '#facc15' : s >= 20 ? '#60a5fa' : '#4ade80';
}

function gaugesvg(score) {
  const r     = 54;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  const color = gaugeColor(score);
  return `<svg width="140" height="140" viewBox="0 0 140 140">
    <circle cx="70" cy="70" r="${r}" class="gauge-track"/>
    <circle cx="70" cy="70" r="${r}" class="gauge-ring" stroke="${color}"
      stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${circ / 4}"/>
    <text x="70" y="65" text-anchor="middle" fill="${color}"
      font-size="26" font-weight="bold" font-family="monospace">${score}</text>
    <text x="70" y="85" text-anchor="middle" fill="var(--mfg)"
      font-size="10" font-family="monospace">/ 100</text>
  </svg>`;
}

function parseResult(raw) {
  try {
    return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch {
    return {
      riskScore:      50,
      riskLevel:      'medium',
      summary:        raw.slice(0, 300),
      keywords:       '',
      analysis:       raw,
      redFlags:       [],
      recommendation: 'Hãy cẩn thận.',
    };
  }
}

// ═══════════════════════════════════════════════
// System prompts (mirrors prompts/ directory)
// ═══════════════════════════════════════════════
const SYS_DETECTIVE = `Bạn là chuyên gia phát hiện lừa đảo trực tuyến tại Việt Nam với hơn 10 năm kinh nghiệm điều tra. Phong cách: sắc bén, logic, thực tế. Bạn không bao giờ đoán mò — chỉ kết luận dựa trên bằng chứng rõ ràng trong tin nhắn. Nhiệm vụ: Phân tích tin nhắn được cung cấp và trả lời bằng JSON hợp lệ theo đúng cấu trúc yêu cầu.`;

const SYS_PSYCH = `Bạn là chuyên gia tâm lý học hành vi, chuyên phân tích các kỹ thuật thao túng tâm lý trong giao tiếp lừa đảo. Phong cách: học thuật nhưng dễ hiểu, đặt mình vào vị trí nạn nhân để giải thích tại sao người ta dễ bị lừa. Nhiệm vụ: Phân tích các chiến thuật tâm lý trong tin nhắn — không phán xét nạn nhân, chỉ giải mã cơ chế vận hành của kẻ lừa đảo.`;

function buildPrompt(msg) {
  return `Phân tích tin nhắn sau để phát hiện lừa đảo:\n\n---TIN NHẮN---\n${msg}\n---KẾT THÚC---\n\nTrả lời JSON hợp lệ (KHÔNG có markdown, KHÔNG có giải thích thêm):\n{"riskScore":<0-100>,"riskLevel":"<safe|low|medium|high|critical>","summary":"<tóm tắt ngắn gọn tiếng Việt>","keywords":"<từ khoá nguy hiểm cách nhau bởi dấu phẩy>","analysis":"<phân tích chi tiết>","redFlags":["<dấu hiệu>"],"recommendation":"<khuyến nghị>"}`;
}

// ═══════════════════════════════════════════════
// OpenAI streaming
// ═══════════════════════════════════════════════
async function callOpenAI(system, userMsg, onToken) {
  const key = getApiKey();
  if (!key) throw new Error('Chưa có API key. Vui lòng nhập vào ô bên trên.');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:                  'gpt-4o-mini',
      max_completion_tokens:  1200,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: userMsg },
      ],
      stream: true,
    }),
  });

  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e?.error?.message || `HTTP ${resp.status}`);
  }

  const reader  = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf  = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
      try {
        const d   = JSON.parse(line.slice(6));
        const tok = d.choices?.[0]?.delta?.content;
        if (tok) { full += tok; onToken(tok); }
      } catch { /* skip malformed SSE chunk */ }
    }
  }
  return full;
}

// ═══════════════════════════════════════════════
// Analyze
// ═══════════════════════════════════════════════
async function analyze() {
  if (analyzing) return;

  const msg = document.getElementById('message-input').value.trim();
  if (!msg) { alert('Vui lòng nhập tin nhắn!'); return; }
  if (!getApiKey()) { alert('Vui lòng nhập OpenAI API Key trước!'); return; }

  analyzing = true;
  const btn = document.getElementById('analyze-btn');
  btn.disabled   = true;
  btn.innerHTML  = `<svg class="spin" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Đang phân tích...`;

  document.getElementById('empty-state').style.display = 'none';
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = '';

  const roles = [
    { id: 'detective', label: 'Phân Tích Trinh Thám', system: SYS_DETECTIVE, cardClass: 'role-card-detective', textClass: 'role-detective' },
  ];
  if (withPsych) {
    roles.push({ id: 'psych', label: 'Phân Tích Tâm Lý', system: SYS_PSYCH, cardClass: 'role-card-psych', textClass: 'role-psych' });
  }

  const allResults = [];

  for (const role of roles) {
    const cardId   = 'card-' + role.id;
    const streamId = 'stream-' + role.id;

    // Streaming placeholder card
    resultsEl.insertAdjacentHTML('beforeend', `
      <div id="${cardId}" class="card-plain" style="border-radius:6px;margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;border-bottom:1px solid var(--bdr)">
          <span style="font-family:'Space Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em" class="${role.textClass}">${role.label}</span>
          <span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--mfg);animation:blink 1s step-end infinite">đang phân tích...</span>
        </div>
        <div style="padding:16px 20px">
          <div id="${streamId}" class="stream-box"><span class="cursor"></span></div>
        </div>
      </div>`);

    let fullRaw = '';
    try {
      fullRaw = await callOpenAI(role.system, buildPrompt(msg), (tok) => {
        const el = document.getElementById(streamId);
        if (!el) return;
        const cur = el.textContent.replace(/\u00a0/g, '');
        el.innerHTML = escHtml(cur + tok).replace(/\n/g, '<br>') + '<span class="cursor"></span>';
      });
    } catch (err) {
      const el = document.getElementById(streamId);
      if (el) el.innerHTML = `<span style="color:#f87171">Lỗi: ${escHtml(err.message)}</span>`;
      resetBtn(btn);
      analyzing = false;
      return;
    }

    const parsed = parseResult(fullRaw);
    allResults.push({ ...parsed, roleId: role.id });

    const score = parsed.riskScore ?? 50;
    const level = parsed.riskLevel ?? 'medium';
    const flags = (parsed.redFlags || [])
      .map(f => `<div class="redflag-item"><span class="redflag-dot">&#9632;</span><span>${escHtml(f)}</span></div>`)
      .join('');

    // Replace streaming card with structured result
    const existing = document.getElementById(cardId);
    if (existing) {
      existing.outerHTML = `
        <div class="card-plain ${role.cardClass}" style="border-radius:6px;margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;border-bottom:1px solid var(--bdr)">
            <span style="font-family:'Space Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em" class="${role.textClass}">${role.label}</span>
            <span class="badge badge-${level}">${score}/100</span>
          </div>
          <div style="padding:16px 20px;display:flex;flex-direction:column;gap:12px">
            ${parsed.analysis ? `<p style="font-size:14px;line-height:1.65">${escHtml(parsed.analysis)}</p>` : ''}
            ${flags ? `<div><div class="kw-section-label">Dấu hiệu đỏ</div><div style="display:flex;flex-direction:column;gap:6px">${flags}</div></div>` : ''}
            ${parsed.recommendation ? `<div class="recommendation">${escHtml(parsed.recommendation)}</div>` : ''}
          </div>
        </div>`;
    }
  }

  // ── Final verdict ─────────────────────────────────────────
  if (allResults.length) {
    const avgScore   = Math.round(allResults.reduce((s, r) => s + (r.riskScore || 50), 0) / allResults.length);
    const order      = ['safe', 'low', 'medium', 'high', 'critical'];
    const finalLevel = allResults.reduce((w, r) => order.indexOf(r.riskLevel) > order.indexOf(w) ? r.riskLevel : w, 'safe');
    const primary    = allResults[0];
    const allKws     = [...new Set(
      allResults.flatMap(r => (r.keywords || '').split(',').map(k => k.trim()).filter(Boolean))
    )].join(', ');
    const isCrisis   = finalLevel === 'high' || finalLevel === 'critical';

    let html = '';

    // Crisis banner
    if (isCrisis) {
      html += `<div class="crisis-banner">
        <div class="crisis-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
          Cảnh báo — Phát hiện lừa đảo nghiêm trọng
        </div>
        <p style="font-size:13px;color:rgba(252,165,165,0.85)">Tin nhắn này có dấu hiệu lừa đảo nguy hiểm. Không thực hiện bất kỳ hướng dẫn nào trong tin nhắn.</p>
        <div class="crisis-links">
          <a href="tel:113"             class="crisis-link">📞 113 — Công an</a>
          <a href="tel:19006099"        class="crisis-link">📞 1900 6099 — BVNTD</a>
          <a href="tel:18001533"        class="crisis-link">📞 1800 1533 — An toàn TT</a>
          <a href="https://canhbao.ncsc.gov.vn" target="_blank" class="crisis-link">🔗 Báo cáo NCSC</a>
        </div>
      </div>`;
    }

    // Verdict card
    const kwCount = allKws ? allKws.split(',').filter(Boolean).length : 0;
    const kwTags  = allKws
      ? allKws.split(',').map(k => k.trim()).filter(Boolean)
          .map(k => `<span class="kw-tag">${escHtml(k)}</span>`).join('')
      : '';

    html += `<div class="card" style="margin-bottom:12px">
      <div style="padding:14px 20px 10px;border-bottom:1px solid var(--bdr)">
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--mfg);text-transform:uppercase;letter-spacing:0.08em">Kết quả tổng hợp</div>
      </div>
      <div style="padding:20px 24px;display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start" class="verdict-grid">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          ${gaugesvg(avgScore)}
          <span class="badge badge-${finalLevel}">${RISK_LABELS[finalLevel] || finalLevel}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
          <div class="summary-box">${escHtml(primary.summary || '')}</div>
          ${allKws ? `
            <div>
              <div class="kw-section-label">Tin nhắn gốc (từ khoá nguy hiểm tô vàng)</div>
              <div class="msg-box">${highlight(msg, allKws)}</div>
              <div style="margin-top:8px;display:flex;flex-wrap:wrap">${kwTags}</div>
            </div>` : ''}
        </div>
      </div>
      <div style="padding:0 24px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        <div class="stat-card"><div class="stat-label">Điểm rủi ro</div><div class="stat-val" style="color:var(--pri)">${avgScore}/100</div></div>
        <div class="stat-card"><div class="stat-label">Mức độ</div><div class="stat-val badge-${finalLevel}" style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:inherit">${RISK_LABELS[finalLevel] || finalLevel}</div></div>
        <div class="stat-card"><div class="stat-label">Phân tích</div><div class="stat-val" style="color:#60a5fa">${allResults.length} AI</div></div>
        <div class="stat-card"><div class="stat-label">Từ khoá</div><div class="stat-val" style="color:#facc15">${kwCount} từ</div></div>
      </div>
    </div>`;

    resultsEl.insertAdjacentHTML('afterbegin', html);

    // Save to history
    history.unshift({
      id:        Date.now(),
      message:   msg,
      riskScore: avgScore,
      riskLevel: finalLevel,
      summary:   primary.summary || '',
      keywords:  allKws,
      date:      new Date().toLocaleString('vi-VN'),
    });
    if (history.length > 50) history.pop();
    localStorage.setItem('sc_history', JSON.stringify(history));
  }

  resetBtn(btn);
  analyzing = false;
}

function resetBtn(btn) {
  btn.disabled  = false;
  btn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Kiểm Tra Ngay`;
}

// ═══════════════════════════════════════════════
// History page
// ═══════════════════════════════════════════════
function renderHistory() {
  const list = document.getElementById('history-list');
  if (!history.length) {
    list.innerHTML = '<div class="no-records">NO_RECORDS_FOUND</div>';
    return;
  }
  const riskIcon = (level) => {
    if (['high', 'critical'].includes(level)) {
      return `<svg width="16" height="16" fill="none" stroke="#f87171" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>`;
    }
    if (level === 'safe') {
      return `<svg width="16" height="16" fill="none" stroke="#4ade80" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }
    return `<svg width="16" height="16" fill="none" stroke="var(--pri)" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>`;
  };

  list.innerHTML = history.map((r, i) => `
    <div class="history-card">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${riskIcon(r.riskLevel)}
            <span class="badge badge-${r.riskLevel}">${r.riskLevel}</span>
            <span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--mfg)">${r.date}</span>
          </div>
          <span style="font-family:'Space Mono',monospace;font-weight:700;font-size:16px;color:var(--pri)">${r.riskScore}/100</span>
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;background:var(--bg);padding:8px 10px;border-radius:4px;border:1px solid var(--bdr);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word">${escHtml(r.message)}</div>
        ${r.summary ? `<p style="font-size:13px;color:var(--mfg);overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">${escHtml(r.summary)}</p>` : ''}
      </div>
      <button class="btn-delete" onclick="deleteHistory(${i})" title="Xóa">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>`).join('');
}

function deleteHistory(i) {
  history.splice(i, 1);
  localStorage.setItem('sc_history', JSON.stringify(history));
  renderHistory();
}

// ═══════════════════════════════════════════════
// Stats page
// ═══════════════════════════════════════════════
function renderStats() {
  const total   = history.length;
  const safe    = history.filter(r => r.riskLevel === 'safe').length;
  const susp    = history.filter(r => ['medium', 'low'].includes(r.riskLevel)).length;
  const danger  = history.filter(r => ['high', 'critical'].includes(r.riskLevel)).length;
  const avg     = total
    ? Math.round(history.reduce((s, r) => s + (r.riskScore || 0), 0) / total)
    : 0;

  document.getElementById('stat-total').textContent      = total;
  document.getElementById('stat-safe').textContent       = safe;
  document.getElementById('stat-suspicious').textContent = susp;
  document.getElementById('stat-dangerous').textContent  = danger;
  document.getElementById('stat-avg').textContent        = avg;
}

// ═══════════════════════════════════════════════
// Keyboard shortcut: Ctrl+Enter
// ═══════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') analyze();
});

// ═══════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════
initTheme();
initApiKey();
