/* app.js — interface de l'appli Révisions 2de (fiches, cartes mémoire, entraînement adaptatif, contrôles blancs) */
"use strict";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const { pick, shuffle, esc } = RV;
const KEY = "rv2de-emma-v1";
const DAY = 86400000;
const CARD_DAYS = [0, 1, 2, 4, 8, 16];
const SKILL_DUE_DAYS = { 4: 2, 5: 5 };
const LEVELS = ["Débutante", "Curieuse", "Appliquée", "Solide", "Experte", "Major de promo", "Prix Nobel"];

const DEFAULT = {
  v: 1, name: "Emma", xp: 0, answered: 0, goal: 20,
  streak: { count: 0, last: null }, today: { day: null, n: 0 },
  skills: {}, cards: {}, exams: { svt: "", pc: "2026-11-19" },
  includeLater: false, sound: true, theme: "auto", tests: [], badges: [],
};
let S = load();
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); return { ...DEFAULT, ...o, streak: { ...DEFAULT.streak, ...(o.streak || {}) }, today: { ...DEFAULT.today, ...(o.today || {}) }, exams: { ...DEFAULT.exams, ...(o.exams || {}) } }; } } catch (e) { }
  return JSON.parse(JSON.stringify(DEFAULT));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
applyTheme();
function applyTheme() { if (S.theme === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", S.theme); }

/* ---------- dates ---------- */
const todayStr = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const dayDiff = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / DAY);
function examInfo(ch) {
  const d = S.exams[ch.examKey];
  if (!d) return { txt: "Date du contrôle à régler", days: null };
  const n = dayDiff(todayStr(), d);
  const wd = new Date(d + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const txt = n < 0 ? `Contrôle passé (${wd})` : n === 0 ? "Contrôle aujourd'hui !" : n === 1 ? "Contrôle demain !" : `Contrôle ${wd} · J-${n}`;
  return { txt, days: n };
}

/* ---------- progression ---------- */
const sk = id => S.skills[id] || (S.skills[id] = { lvl: 0, row: 0, ok: 0, ko: 0, due: 0, seen: 0, lastKo: 0 });
const cd = id => S.cards[id] || { box: 0, due: 0, seen: 0 };
const activeSkills = ch => ch.skills.filter(s => !s.later || S.includeLater);
const isDue = s => { const c = S.skills[s.id]; return c && c.lvl >= 4 && c.due <= Date.now(); };
function skillPct(ch) { const a = activeSkills(ch); return a.reduce((t, s) => t + sk(s.id).lvl, 0) / (a.length * 5); }
function cardPct(ch) { return ch.cards.reduce((t, c) => t + cd(c.id).box, 0) / (ch.cards.length * 5); }
function chapterPct(ch) { return Math.round((skillPct(ch) * 0.75 + cardPct(ch) * 0.25) * 100); }
function updateSkill(id, ok) {
  const c = sk(id); c.seen++;
  if (ok) {
    c.ok++; c.row++;
    const need = c.lvl < 2 ? 2 : 3;
    if (c.lvl >= 4 && c.due <= Date.now()) { c.lvl = Math.min(5, c.lvl + (c.row >= 2 ? 1 : 0)); c.due = Date.now() + SKILL_DUE_DAYS[c.lvl] * DAY; c.row = 0; }
    else if (c.row >= need && c.lvl < 5) { c.lvl++; c.row = 0; if (c.lvl >= 4) c.due = Date.now() + SKILL_DUE_DAYS[c.lvl] * DAY; if (c.lvl === 4) toast("🎯 Compétence maîtrisée : " + RV.skill(id).name); }
  } else { c.ko++; c.row = 0; c.lvl = Math.max(0, c.lvl - 1); c.due = 0; c.lastKo = Date.now(); }
}
function level() { return Math.min(LEVELS.length - 1, Math.floor(Math.sqrt(S.xp / 80))); }
function touchDay(n = 1) {
  const t = todayStr();
  if (S.streak.last !== t) { S.streak.count = (S.streak.last && dayDiff(S.streak.last, t) === 1) ? S.streak.count + 1 : 1; S.streak.last = t; }
  if (S.today.day !== t) S.today = { day: t, n: 0 };
  S.today.n += n;
}
function streakNow() { const t = todayStr(); return S.streak.last === t || (S.streak.last && dayDiff(S.streak.last, t) === 1) ? S.streak.count : 0; }
const todayN = () => S.today.day === todayStr() ? S.today.n : 0;

const BADGES = [
  { id: "first", icon: "🌱", name: "Premiers pas", test: s => s.answered >= 1 },
  { id: "s3", icon: "🔥", name: "3 jours d'affilée", test: s => s.streak.count >= 3 },
  { id: "s7", icon: "🏆", name: "7 jours d'affilée", test: s => s.streak.count >= 7 },
  { id: "q100", icon: "💯", name: "100 questions", test: s => s.answered >= 100 },
  { id: "q500", icon: "🚀", name: "500 questions", test: s => s.answered >= 500 },
  { id: "exam15", icon: "📝", name: "15/20 à un contrôle blanc", test: s => s.tests.some(t => t.score / t.total >= 0.75) },
  { id: "exam18", icon: "🌟", name: "18/20 à un contrôle blanc", test: s => s.tests.some(t => t.score / t.total >= 0.9) },
  { id: "master", icon: "🧠", name: "Un chapitre maîtrisé", test: s => RV.chapters.some(ch => activeSkills(ch).every(x => (s.skills[x.id] || {}).lvl >= 4)) },
];
function checkBadges() { const got = BADGES.filter(b => !S.badges.includes(b.id) && b.test(S)); got.forEach(b => S.badges.push(b.id)); if (got.length) { save(); setTimeout(() => toast(got[0].icon + " Badge débloqué : " + got[0].name), 900); } }

/* ---------- effets ---------- */
let audioCtx, toastT;
function beep(good) { if (!S.sound) return; try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const t = audioCtx.currentTime; (good ? [[660, 0], [990, .08]] : [[240, 0], [190, .12]]).forEach(([f, d]) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = good ? "triangle" : "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(.2, t + d + .01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + .2); o.connect(g).connect(audioCtx.destination); o.start(t + d); o.stop(t + d + .3); }); } catch (e) { } }
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
function floatXp(n) { const d = document.createElement("div"); d.className = "xpfloat"; d.style.top = (innerHeight * .4) + "px"; d.textContent = "+" + n + " XP"; document.body.appendChild(d); setTimeout(() => d.remove(), 1000); }
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("#confetti"); c.hidden = false; const x = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
  const cols = ["#0E9F6E", "#7C3AED", "#F59E0B", "#3B82F6", "#E11D48"];
  const ps = Array.from({ length: 130 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 5, c: pick(cols), a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
  const t0 = performance.now();
  (function f(t) { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += p.va; p.vy += .03; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6); x.restore(); }); if (t - t0 < 3200) requestAnimationFrame(f); else c.hidden = true; })(t0);
}
const ring = (pct, size = 54, col = "#fff", bg = "rgba(255,255,255,.25)") => { const r = size / 2 - 5, C = 2 * Math.PI * r; return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-label="${pct} %"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${bg}" stroke-width="6"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="800" fill="${col}" font-family="Inter,sans-serif">${pct}%</text></svg>`; };
const dots = lvl => `<span class="dots" aria-label="niveau ${lvl} sur 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= lvl ? "on" : ""}"></i>`).join("")}</span>`;

/* ---------- navigation ---------- */
const V = () => $("#view");
let screen = "home", session = null;
function go(name, arg) {
  if (session && session.active) { if (!confirm("Quitter la série en cours ? Ta progression sur les questions déjà faites est gardée.")) return; session = null; }
  if (exam) { if (!confirm("Arrêter le contrôle blanc ? Il ne sera pas noté.")) return; exam = null; }
  screen = name; closeSheets();
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.go === name || (name === "chapter" && t.dataset.go === "home")));
  window.scrollTo(0, 0);
  ({ home: renderHome, chapter: renderChapter, fiches: renderFiches, progress: renderProgress, settings: renderSettings })[name](arg);
}
$$(".tab").forEach(t => t.addEventListener("click", () => go(t.dataset.go)));

/* ---------- accueil ---------- */
function renderHome() {
  const st = streakNow(), n = todayN(), lv = level();
  V().innerHTML = `
<div class="top"><h1>Salut ${esc(S.name)} 👋</h1><span class="pill" title="jours d'affilée">🔥 ${st}</span><span class="pill" title="points d'expérience">⭐ ${S.xp}</span></div>
<p class="muted" style="margin-top:-6px">Niveau : <b>${LEVELS[lv]}</b></p>
<div class="card goal" style="margin:14px 0 20px">
  ${ring(Math.min(100, Math.round(n / S.goal * 100)), 64, "var(--accent)", "var(--line)")}
  <div class="grow"><b>Objectif du jour : ${S.goal} questions</b><div class="small muted">${n >= S.goal ? "Objectif atteint, bravo ! Tu peux continuer." : `${n} faite${n > 1 ? "s" : ""}, encore ${S.goal - n}. Environ 10 minutes.`}</div></div>
</div>
<div class="stack">${RV.chapters.map(ch => { const ex = examInfo(ch), sub = RV.subjects[ch.subject]; const weak = activeSkills(ch).filter(s => { const c = sk(s.id); return c.ko > 0 && c.lvl < 4; }).length, due = activeSkills(ch).filter(isDue).length; return `
  <section class="${ch.subject}c">
  <button class="chap ${ch.subject}" data-ch="${ch.id}">
    <span class="ring">${ring(chapterPct(ch))}</span>
    <div class="k">${sub.icon} ${sub.name} · ${ch.code}</div>
    <h2>${ch.title}</h2>
    <div class="meta"><span>${ex.days != null && ex.days >= 0 && ex.days <= 3 ? "⏰ " : "📅 "}${ex.txt}</span></div>
  </button>
  <div class="acts">
    <button data-fiche="${ch.id}"><span class="ic">📖</span>Fiches</button>
    <button data-rev="${ch.id}" class="main ${ch.subject}"><span class="ic">🎯</span>Réviser</button>
    <button data-exam="${ch.id}"><span class="ic">📝</span>Contrôle blanc</button>
  </div>
  ${weak || due ? `<p class="xsmall muted" style="margin:6px 4px 0">${[weak ? `${weak} compétence${weak > 1 ? "s" : ""} à retravailler` : "", due ? `${due} révision${due > 1 ? "s" : ""} prévue${due > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ")} : « Réviser » s'en occupe en priorité.</p>` : ""}
  </section>`; }).join("")}</div>
<p class="xsmall muted center" style="margin-top:22px">Chaque matière a ses propres révisions. Tout est enregistré sur ce téléphone.</p>`;
  $$("[data-ch]").forEach(b => b.onclick = () => go("chapter", { id: b.dataset.ch }));
  $$("[data-fiche]").forEach(b => b.onclick = () => go("chapter", { id: b.dataset.fiche, tab: "cours" }));
  $$("[data-exam]").forEach(b => b.onclick = () => go("chapter", { id: b.dataset.exam, tab: "exam" }));
  $$("[data-rev]").forEach(b => b.onclick = () => { const ch = RV.chapter(b.dataset.rev); startSession({ mode: "train", title: "Révision " + RV.subjects[ch.subject].name, chapters: [ch], n: 15 }); });
}

/* ---------- fiches (toutes matières, chacune séparée) ---------- */
function renderFiches() {
  V().innerHTML = `<div class="top"><h1>Fiches de révision</h1></div>
  <p class="small muted" style="margin-top:-6px">Choisis une fiche : elle s'ouvre directement, avec les exercices correspondants en dessous.</p>
  ${RV.chapters.map(ch => { const sub = RV.subjects[ch.subject]; return `<div class="${ch.subject}c" style="margin-top:18px">
    <div class="row" style="margin-bottom:8px"><span class="tag ${ch.subject}">${sub.icon} ${sub.name}</span><h3 class="grow">${ch.title}</h3></div>
    ${ch.lesson.map(s => `<button class="skill" data-open="${ch.id}|${s.id}"><div class="grow"><div class="nm">${s.title}</div></div>${s.badge || ""}<span>›</span></button>`).join("")}
    <div class="small muted" style="margin:12px 4px 6px;font-weight:700">🧭 Méthodes et pièges</div>
    ${ch.methods.map(s => `<button class="skill" data-open="${ch.id}|${s.id}"><div class="grow"><div class="nm">${s.title}</div></div><span>›</span></button>`).join("")}
  </div>`; }).join("")}`;
  $$("[data-open]").forEach(b => b.onclick = () => { const [id, sec] = b.dataset.open.split("|"); go("chapter", { id, tab: "cours", open: sec }); });
}

/* ---------- chapitre ---------- */
let chTab = {};
function renderChapter(arg) {
  const ch = RV.chapter(arg.id), tab = arg.tab || chTab[ch.id] || "cours"; chTab[ch.id] = tab;
  const sub = RV.subjects[ch.subject], ex = examInfo(ch);
  V().innerHTML = `<div class="${ch.subject}c">
<div class="top"><button class="btn ghost sm" data-act="back" aria-label="Retour">←</button><div class="grow"><div class="small muted">${sub.icon} ${sub.name} · Chapitre ${ch.code}</div><h1 style="font-size:23px">${ch.title}</h1></div></div>
<div class="row small"><span class="tag ${ch.subject}">${ex.txt}</span><span class="muted">Maîtrise ${chapterPct(ch)} %</span></div>
<div class="seg" role="tablist">${[["cours", "📖 Fiches"], ["cartes", "🃏 Cartes"], ["train", "🎯 Exos"], ["exam", "📝 Contrôle"]].map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
<div id="chbody"></div></div>`;
  V().querySelector("[data-act=back]").onclick = () => go("home");
  $$("[data-tab]").forEach(b => b.onclick = () => renderChapter({ id: ch.id, tab: b.dataset.tab }));
  ({ cours: tabCours, cartes: tabCartes, train: tabTrain, exam: tabExam })[tab](ch, $("#chbody"), arg.open);
}
function tabCours(ch, el, open) {
  const secHtml = (s, open) => `<details class="sec" id="sec-${s.id}" ${open ? "open" : ""}><summary>${s.title} ${s.badge || ""}</summary><div class="secbody tableX">${s.html()}
    ${ch.skills.filter(k => k.lesson === s.id).length ? `<div class="row wrapflex" style="margin-top:12px">${ch.skills.filter(k => k.lesson === s.id).map(k => `<button class="btn ghost sm" data-skill="${k.id}">🎯 ${k.name}</button>`).join("")}</div>` : ""}</div></details>`;
  el.innerHTML = `<p class="small muted">La fiche du cahier, réorganisée. Ouvre une partie, lis-la, puis entraîne-toi juste en dessous.</p>
  ${ch.lesson.map(s => secHtml(s, s.id === open)).join("")}
  <h2 style="margin:22px 0 10px">🧭 Méthodes et pièges</h2>
  ${ch.methods.map(s => secHtml(s, s.id === open)).join("")}`;
  if (open) { const d = el.querySelector("#sec-" + open); if (d) setTimeout(() => { d.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); }, 30); }
  el.querySelectorAll("[data-skill]").forEach(b => b.onclick = () => startSkill(b.dataset.skill));
}
function tabTrain(ch, el) {
  const act = activeSkills(ch), later = ch.skills.filter(s => s.later);
  const due = act.filter(isDue).length;
  el.innerHTML = `<button class="btn block ${ch.subject}" data-act="smart" style="min-height:56px">🧠 Séance intelligente · 12 questions</button>
  <p class="small muted" style="margin:8px 2px 18px">Elle choisit tes compétences les plus faibles${due ? ` et ${due} révision${due > 1 ? "s" : ""} prévue${due > 1 ? "s" : ""} aujourd'hui` : ""}. Chaque erreur revient un peu plus tard pour bien la fixer.</p>
  <h3 style="margin-bottom:10px">Par compétence</h3>
  ${act.map(s => skillBtn(s)).join("")}
  ${later.length && !S.includeLater ? `<h3 style="margin:18px 0 6px">Pas au contrôle de jeudi</h3><p class="small muted">Activables dans Réglages. Tu peux quand même t'y entraîner :</p>${later.map(s => skillBtn(s)).join("")}` : ""}`;
  el.querySelector("[data-act=smart]").onclick = () => startSession({ mode: "train", title: "Séance intelligente", chapters: [ch], n: 12 });
  el.querySelectorAll("[data-skill]").forEach(b => b.onclick = () => startSkill(b.dataset.skill));
}
function skillBtn(s) { const c = sk(s.id); return `<button class="skill" data-skill="${s.id}"><div class="grow"><div class="nm">${s.name}${isDue(s) ? ' <span class="tag hot">à revoir</span>' : ""}</div><div class="sh">${s.short}</div></div><div class="lv">${dots(c.lvl)}<div class="xsmall muted">${c.seen ? `${c.ok}/${c.seen} justes` : "pas encore vu"}</div></div></button>`; }

/* ---------- séances d'entraînement ---------- */
function startSkill(id) { const s = RV.skill(id); startSession({ mode: "train", title: s.name, skills: [s], n: 8 }); }
function startDaily() {
  const chs = RV.chapters.map(ch => { const d = examInfo(ch).days; return { ch, w: d != null && d >= 0 && d <= 10 ? 3 : 1 }; });
  startSession({ mode: "train", title: "Parcours du jour", chapters: chs.map(o => o.ch), chWeight: Object.fromEntries(chs.map(o => [o.ch.id, o.w])), n: 15 });
}
function pickSkills(opts) {
  if (opts.skills) return Array.from({ length: opts.n }, (_, i) => opts.skills[i % opts.skills.length]);
  const pool = opts.chapters.flatMap(ch => activeSkills(ch));
  const weight = s => { const c = sk(s.id); let w = (5 - c.lvl) * 2 + 1; if (isDue(s)) w += 8; if (c.lastKo && Date.now() - c.lastKo < 3 * DAY) w += 3; if (!c.seen) w += 2; return w * ((opts.chWeight || {})[s.chapter] || 1); };
  const out = [], count = {};
  while (out.length < opts.n) {
    const cand = pool.filter(s => (count[s.id] || 0) < 2 && out[out.length - 1] !== s);
    const list = cand.length ? cand : pool;
    const tot = list.reduce((t, s) => t + weight(s), 0); let r = Math.random() * tot;
    const s = list.find(s => (r -= weight(s)) <= 0) || list[0];
    out.push(s); count[s.id] = (count[s.id] || 0) + 1;
  }
  return out;
}
function startSession(opts) {
  session = { active: true, ...opts, queue: pickSkills(opts), i: 0, good: 0, bad: 0, xp: 0, retries: 0, wrong: [] };
  session.total = session.queue.length;
  screen = "session"; nextQuestion();
}
function nextQuestion() {
  if (session.i >= session.queue.length) return endSession();
  const s = session.queue[session.i];
  const q = s.gen(sk(s.id).lvl); q.skill = s;
  renderQuestionScreen(q, { mode: "train" });
}
function afterAnswer(q, ok, frac) {
  const s = q.skill;
  updateSkill(s.id, ok);
  S.answered++; touchDay();
  const xp = ok ? 10 : 2; S.xp += xp; session.xp += xp;
  if (ok) session.good++; else { session.bad++; session.wrong.push(q); if (session.retries < 6) { session.queue.splice(Math.min(session.i + 3, session.queue.length), 0, s); session.retries++; } }
  save(); checkBadges();
  if (ok) floatXp(xp);
  session.i++;
}
function endSession() {
  const s = session; session = null;
  const pct = Math.round(s.good / Math.max(1, s.good + s.bad) * 100);
  if (pct >= 80) confetti();
  const skills = [...new Set(s.queue.map(x => x.id))].map(RV.skill);
  V().innerHTML = `<div class="center" style="padding-top:20px">
  <div class="score">${pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "💪" : "🌱"}</div>
  <h1 style="margin:10px 0 4px">${pct >= 90 ? "Excellent !" : pct >= 70 ? "Très bien !" : pct >= 50 ? "C'est en progrès" : "On continue, ça va venir"}</h1>
  <p class="muted">${s.good} bonne${s.good > 1 ? "s" : ""} réponse${s.good > 1 ? "s" : ""} sur ${s.good + s.bad} · +${s.xp} XP</p></div>
  <div class="card flat" style="margin:16px 0"><h3 style="margin-bottom:8px">Tes compétences</h3>${skills.map(k => `<div class="row" style="padding:6px 0"><span class="grow">${k.name}</span>${dots(sk(k.id).lvl)}</div>`).join("")}</div>
  ${s.wrong.length ? `<div class="card flat"><h3 style="margin-bottom:6px">À relire</h3><p class="small muted">Les ${s.wrong.length} erreurs de la série, avec la correction :</p>${s.wrong.map(q => `<div class="revq bad"><div class="small">${q.prompt.replace(/<table[\s\S]*?<\/table>/g, "[tableau]")}</div><div class="small" style="margin-top:6px">✅ <b>${RV.answerText(q)}</b></div></div>`).join("")}</div>` : ""}
  <div class="row" style="margin-top:16px"><button class="btn ghost grow" data-act="home">Accueil</button><button class="btn grow" data-act="again">Encore une série</button></div>`;
  V().querySelector("[data-act=home]").onclick = () => go("home");
  V().querySelector("[data-act=again]").onclick = () => startSession({ ...s, active: true });
  window.scrollTo(0, 0);
}

/* ---------- écran question (entraînement et contrôle) ---------- */
function renderQuestionScreen(q, ctx) {
  const s = q.skill, ch = RV.chapter(s.chapter);
  const isExam = ctx.mode === "exam"; closeSheets();
  const done = isExam ? exam.i : session.i, total = isExam ? exam.qs.length : session.queue.length;
  V().innerHTML = `<div class="${ch.subject}c">
  <div class="qhead"><button class="btn ghost sm" data-act="quit" aria-label="Quitter">✕</button><div class="bar grow ${ch.subject}"><i style="width:${Math.round(done / total * 100)}%"></i></div><span class="small muted num">${done + 1}/${total}</span></div>
  <div class="qskill"><span class="tag ${ch.subject}">${RV.subjects[ch.subject].name}</span>${s.name}${!isExam ? " " + dots(sk(s.id).lvl) : ""}</div>
  <div class="card"><div class="prompt tableX">${q.prompt}</div>${q.fig || ""}<div id="qzone"></div></div>
  <div id="fbzone"></div>
  <div class="sticky-bottom"><button class="btn block" id="go" disabled>Valider</button></div></div>`;
  V().querySelector("[data-act=quit]").onclick = () => { if (isExam) { if (confirm("Arrêter le contrôle blanc ? Il ne sera pas noté.")) { exam = null; go("chapter", { id: ch.id, tab: "exam" }); } } else { session.active = false; endSession(); } };
  window.scrollTo(0, 0);
  const zone = $("#qzone"), goBtn = $("#go");
  let answer = null, locked = false;
  const setReady = r => goBtn.disabled = !r;

  // ----- types -----
  if (q.type === "qcm" || q.type === "vf" || q.type === "multi") {
    const multi = q.type === "multi"; answer = multi ? [] : null;
    zone.innerHTML = `${multi ? '<p class="small muted" style="margin:12px 0 0">Plusieurs réponses possibles.</p>' : ""}<div class="choices">${q.choices.map((c, i) => `<button class="choice ${multi ? "" : "radio"}" data-i="${i}"><span class="box"></span><span>${c}</span></button>`).join("")}</div>`;
    zone.querySelectorAll(".choice").forEach(b => b.onclick = () => {
      if (locked) return; const i = +b.dataset.i;
      if (multi) { answer = answer.includes(i) ? answer.filter(x => x !== i) : [...answer, i]; b.classList.toggle("sel"); b.querySelector(".box").textContent = b.classList.contains("sel") ? "✓" : ""; setReady(answer.length > 0); }
      else { answer = i; zone.querySelectorAll(".choice").forEach(x => x.classList.toggle("sel", x === b)); setReady(true); }
    });
  } else if (q.type === "num" || q.type === "text") {
    zone.innerHTML = `<div class="ansrow"><input id="ans" ${q.type === "num" ? 'inputmode="decimal"' : 'autocapitalize="off" autocomplete="off" spellcheck="false"'} placeholder="${q.type === "num" ? "ta réponse" : q.hint || "ta réponse"}" aria-label="Ta réponse">${q.unit ? `<span class="unit">${q.unit}</span>` : ""}</div>${q.type === "num" ? '<p class="xsmall muted" style="margin:6px 2px 0">Virgule ou point acceptés. Un arrondi raisonnable est accepté.</p>' : ""}`;
    const inp = $("#ans"); inp.oninput = () => { answer = inp.value; setReady(inp.value.trim().length > 0); };
    inp.onkeydown = e => { if (e.key === "Enter" && !goBtn.disabled) goBtn.click(); };
    if (matchMedia("(pointer:fine)").matches) inp.focus();
  } else if (q.type === "match") {
    answer = q.left.map(() => -1);
    zone.innerHTML = q.left.map((l, i) => `<div class="matchrow" data-r="${i}"><span class="l">${l}</span><select data-i="${i}" aria-label="${esc(l.replace(/<[^>]+>/g, ""))}"><option value="-1">Choisir…</option>${q.options.map((o, j) => `<option value="${j}">${o.replace(/<[^>]+>/g, "")}</option>`).join("")}</select></div>`).join("");
    zone.querySelectorAll("select").forEach(sel => sel.onchange = () => { answer[+sel.dataset.i] = +sel.value; setReady(answer.every(v => v >= 0)); });
  } else if (q.type === "order") {
    answer = [];
    const draw = () => {
      zone.innerHTML = `<p class="small muted" style="margin:12px 0 0">Touche les étiquettes dans le bon ordre (touche une étiquette placée pour l'enlever).</p>
      <div class="orderlist">${answer.length ? answer.map((i, k) => `<button class="chip" data-k="${k}">${q.items[i]}</button>`).join("") : '<span class="empty">Ton ordre apparaîtra ici</span>'}</div>
      <div class="orderpool">${q.items.map((it, i) => `<button class="chip ${answer.includes(i) ? "used" : ""}" data-i="${i}">${it}</button>`).join("")}</div>`;
      if (locked) return;
      zone.querySelectorAll(".orderpool .chip").forEach(b => b.onclick = () => { answer.push(+b.dataset.i); draw(); setReady(answer.length === q.items.length); });
      zone.querySelectorAll(".orderlist .chip").forEach(b => b.onclick = () => { answer.splice(+b.dataset.k, 1); draw(); setReady(false); });
    };
    draw();
  } else if (q.type === "redac") {
    zone.innerHTML = `<textarea id="ans" placeholder="Rédige ta réponse ici, comme sur ta copie (facultatif mais très conseillé : c'est en écrivant qu'on apprend)."></textarea>`;
    goBtn.textContent = isExam ? "Question suivante" : "Voir la correction"; setReady(true);
  }

  // ----- validation -----
  goBtn.onclick = () => {
    if (isExam) { exam.answers[exam.i] = q.type === "redac" ? { text: $("#ans").value } : answer; exam.i++; return nextExamQuestion(); }
    if (locked) return nextQuestion();
    if (q.type === "redac") return showRedacCorrection(q, $("#ans").value);
    locked = true;
    const ok = RV.check(q, answer);
    paintAnswer(q, answer, zone);
    showFeedback(q, ok);
    afterAnswer(q, ok);
    beep(ok);
    goBtn.textContent = "Continuer"; goBtn.disabled = false;
    if (ok) goBtn.focus();
  };

  function showRedacCorrection(q, txt) {
    locked = true;
    const ticks = q.points.map(() => false);
    $("#fbzone").innerHTML = `<div class="fb neutral"><h3>📝 Corrige-toi toi-même</h3>
      ${txt.trim() ? `<p class="small muted">Ta réponse :</p><div class="model" style="white-space:pre-wrap">${esc(txt)}</div>` : ""}
      <p class="small muted" style="margin-top:10px">Coche chaque point que tu avais (honnêtement 😉) :</p>
      ${q.points.map((p, i) => `<button class="checkpt" data-p="${i}"><span class="box"></span><span>${p}</span></button>`).join("")}
      <p class="small muted" style="margin-top:12px">Réponse modèle :</p><div class="model">${q.model}</div></div>`;
    $$("[data-p]").forEach(b => b.onclick = () => { const i = +b.dataset.p; ticks[i] = !ticks[i]; b.classList.toggle("on", ticks[i]); b.querySelector(".box").textContent = ticks[i] ? "✓" : ""; });
    $("#ans").readOnly = true;
    goBtn.textContent = "Valider mon auto-correction";
    goBtn.onclick = () => {
      const frac = ticks.filter(Boolean).length / ticks.length, ok = frac >= 0.75;
      afterAnswer(q, ok); beep(ok);
      toast(ok ? `👍 ${Math.round(frac * 100)} % des points : compétence validée` : `${Math.round(frac * 100)} % des points : relis la réponse modèle`);
      nextQuestion();
    };
    $("#fbzone").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
function paintAnswer(q, a, zone) {
  if (["qcm", "vf", "multi"].includes(q.type)) {
    const good = q.type === "multi" ? q.answer : [q.answer], mine = q.type === "multi" ? a : [a];
    zone.querySelectorAll(".choice").forEach(b => { const i = +b.dataset.i; b.disabled = true; b.classList.remove("sel"); if (good.includes(i) && mine.includes(i)) b.classList.add("good"); else if (mine.includes(i)) b.classList.add("bad"); else if (good.includes(i)) b.classList.add("miss"); const bx = b.querySelector(".box"); bx.textContent = good.includes(i) ? "✓" : mine.includes(i) ? "✗" : ""; });
  } else if (q.type === "num" || q.type === "text") { const inp = $("#ans"); inp.readOnly = true; inp.classList.add(RV.check(q, a) ? "good" : "bad"); }
  else if (q.type === "match") zone.querySelectorAll(".matchrow").forEach((r, i) => { const sel = r.querySelector("select"); sel.disabled = true; const ok = q.options[a[i]] === q.options[q.answer[i]]; r.classList.add(ok ? "good" : "bad"); if (!ok) r.insertAdjacentHTML("beforeend", `<span class="small">✅ ${q.options[q.answer[i]]}</span>`); });
  else if (q.type === "order") zone.querySelectorAll(".chip").forEach(b => b.disabled = true);
}
function showFeedback(q, ok) {
  const s = q.skill, ch = RV.chapter(s.chapter);
  $("#fbzone").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><h3>${ok ? "✅ Bonne réponse" : "❌ Pas tout à fait"}</h3>
    ${ok ? "" : `<div>La réponse : <b>${RV.answerText(q)}</b></div>`}
    <div class="expl">${q.expl}</div>${q.trap ? `<div class="trap">⚠️ ${q.trap}</div>` : ""}
    ${ok ? "" : `<button class="btn ghost sm" style="margin-top:10px" data-lesson="${s.lesson}">📖 Revoir ce point du cours</button><p class="xsmall muted" style="margin:8px 0 0">Une question du même type reviendra dans quelques questions.</p>`}</div>`;
  const b = $("#fbzone [data-lesson]"); if (b) b.onclick = () => openLesson(ch, s.lesson);
  setTimeout(() => $("#fbzone").scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
}
function closeSheets() { document.querySelectorAll(".sheet").forEach(x => x.parentNode.removeChild(x)); }
function openLesson(ch, secId) {
  const sec = ch.lesson.find(s => s.id === secId) || ch.methods.find(s => s.id === secId);
  const d = document.createElement("div"); d.className = "sheet"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
  d.innerHTML = `<div class="pane ${ch.subject}c"><div class="row" style="margin-bottom:10px"><h2 class="grow">${sec.title}</h2><button class="btn ghost sm" data-x aria-label="Fermer">✕</button></div><div class="tableX">${sec.html()}</div><button class="btn block" data-x style="margin-top:14px">J'ai relu, je continue</button></div>`;
  document.body.appendChild(d);
  const close = () => d.remove();
  d.querySelectorAll("[data-x]").forEach(b => b.onclick = close);
  d.onclick = e => { if (e.target === d) close(); };
}

/* ---------- cartes mémoire ---------- */
function tabCartes(ch, el) {
  const now = Date.now();
  const dueC = ch.cards.filter(c => { const s = cd(c.id); return s.seen && s.due <= now; });
  const newC = ch.cards.filter(c => !cd(c.id).seen);
  const known = ch.cards.filter(c => cd(c.id).box >= 3).length;
  el.innerHTML = `<div class="kpi"><div><b>${dueC.length}</b><span class="small muted">à revoir</span></div><div><b>${newC.length}</b><span class="small muted">nouvelles</span></div><div><b>${known}/${ch.cards.length}</b><span class="small muted">bien sues</span></div></div>
  <button class="btn block ${ch.subject}" data-act="go" style="margin-top:14px;min-height:56px" ${dueC.length + newC.length ? "" : "disabled"}>🃏 Réviser ${Math.min(20, dueC.length + Math.min(10, newC.length))} cartes</button>
  <button class="btn ghost block" data-act="all" style="margin-top:8px">Toutes les cartes, en vrac</button>
  <p class="small muted" style="margin-top:14px">Lis la question, <b>essaie de répondre dans ta tête (ou à voix haute)</b>, puis retourne la carte. Sois honnête : une carte ratée revient plus souvent, une carte sue s'espace (1, 2, 4, 8, 16 jours).</p>`;
  el.querySelector("[data-act=go]").onclick = () => startFlash(ch, shuffle(dueC).concat(newC.slice(0, 10)).slice(0, 20));
  el.querySelector("[data-act=all]").onclick = () => startFlash(ch, shuffle(ch.cards), true);
}
function startFlash(ch, list, free) {
  let i = 0, again = [], good = 0;
  session = { active: true };
  const draw = () => {
    if (i >= list.length) {
      session = null;
      V().innerHTML = `<div class="center" style="padding-top:30px"><div class="score">🃏</div><h1 style="margin:12px 0 6px">Paquet terminé</h1><p class="muted">${good} carte${good > 1 ? "s" : ""} sue${good > 1 ? "s" : ""} du premier coup sur ${list.length - again.length}.</p></div><button class="btn block" data-act="back" style="margin-top:20px">Retour au chapitre</button>`;
      V().querySelector("[data-act=back]").onclick = () => go("chapter", { id: ch.id, tab: "cartes" });
      return;
    }
    const c = list[i];
    V().innerHTML = `<div class="${ch.subject}c"><div class="qhead"><button class="btn ghost sm" data-act="quit" aria-label="Quitter">✕</button><div class="bar grow ${ch.subject}"><i style="width:${Math.round(i / list.length * 100)}%"></i></div><span class="small muted num">${i + 1}/${list.length}</span></div>
    <div class="flash" id="fl" role="button" tabindex="0" aria-label="Retourner la carte"><div class="in"><div class="face"><div class="q">${c.f}</div><span class="hint">Touche pour retourner</span></div><div class="face back"><div class="a">${c.b}</div></div></div></div>
    <div id="rate" class="rate hidden"><button class="btn ko" data-r="0">Je ne savais pas<small>revient bientôt</small></button><button class="btn mid" data-r="1">Hésitation<small>à revoir</small></button><button class="btn okb" data-r="2">Je savais<small>s'espace</small></button></div>
    <button class="btn block ghost" id="flipb">Retourner la carte</button></div>`;
    const fl = $("#fl"), flip = () => { fl.classList.add("flip"); $("#rate").classList.remove("hidden"); $("#flipb").classList.add("hidden"); };
    fl.onclick = flip; fl.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } }; $("#flipb").onclick = flip;
    V().querySelector("[data-act=quit]").onclick = () => { session = null; go("chapter", { id: ch.id, tab: "cartes" }); };
    $$("[data-r]").forEach(b => b.onclick = () => {
      const r = +b.dataset.r, st = { ...cd(c.id) }; st.seen = (st.seen || 0) + 1;
      if (r === 2) { st.box = Math.min(5, st.box + 1); good += again.includes(c) ? 0 : 1; }
      else if (r === 1) st.box = Math.max(1, st.box);
      else st.box = 0;
      st.due = Date.now() + CARD_DAYS[st.box] * DAY - (st.box ? 3 * 3600000 : 0);
      S.cards[c.id] = st;
      if (r < 2 && !again.includes(c)) { again.push(c); list.splice(Math.min(i + 4, list.length), 0, c); }
      S.xp += r === 2 ? 3 : 1; touchDay(0); save(); checkBadges();
      i++; draw();
    });
  };
  draw();
}

/* ---------- contrôle blanc ---------- */
let exam = null;
function examPlan(ch) { return ch.exam.concat(S.includeLater && ch.examLater ? ch.examLater : []); }
function tabExam(ch, el) {
  const plan = examPlan(ch), total = plan.reduce((t, p) => t + p[1], 0);
  const hist = S.tests.filter(t => t.ch === ch.id).slice(-6).reverse();
  el.innerHTML = `<div class="card flat"><h3>📝 Contrôle blanc</h3><p style="margin-top:6px">${total} questions comme au vrai contrôle, sur tout le chapitre${ch.examLater && !S.includeLater ? " (sans les tests chimiques ni la CCM, qui ne sont pas au contrôle de jeudi)" : ""}. <b>Pas de correction avant la fin.</b> Note sur 20, puis correction détaillée de chaque question.</p>
  <p class="small muted">Durée conseillée : ${Math.round(total * 1.3)} minutes, au calme, sans regarder le cours. Les questions de rédaction s'auto-corrigent à la fin.</p>
  <button class="btn block ${ch.subject}" data-act="start" style="margin-top:6px;min-height:54px">Commencer le contrôle blanc</button></div>
  ${hist.length ? `<h3 style="margin:18px 0 8px">Mes derniers contrôles blancs</h3>${hist.map(t => `<div class="row card flat" style="padding:10px 14px;margin-bottom:8px"><span class="grow small">${new Date(t.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span><b class="num">${fmt20(t)}/20</b></div>`).join("")}` : ""}`;
  el.querySelector("[data-act=start]").onclick = () => startExam(ch);
}
const fmt20 = t => RV.fmt(Math.round(t.score / t.total * 20 * 2) / 2);
function startExam(ch) {
  const qs = shuffle(examPlan(ch).flatMap(([id, n]) => Array.from({ length: n }, () => { const s = RV.skill(id); const q = s.gen(Math.max(2, Math.min(5, sk(s.id).lvl + RV.rnd(0, 1)))); q.skill = s; return q; })));
  // les rédactions à la fin, comme souvent au contrôle
  qs.sort((a, b) => (a.type === "redac") - (b.type === "redac"));
  exam = { ch, qs, answers: [], i: 0, t0: Date.now() };
  screen = "exam"; nextExamQuestion();
}
function nextExamQuestion() {
  if (exam.i >= exam.qs.length) return gradeExam();
  renderQuestionScreen(exam.qs[exam.i], { mode: "exam" });
  $("#go").textContent = exam.i === exam.qs.length - 1 ? "Terminer le contrôle" : "Question suivante";
}
function gradeExam() {
  const { ch, qs, answers } = exam;
  const res = qs.map((q, i) => ({ q, a: answers[i], ok: q.type === "redac" ? null : RV.check(q, answers[i]), ticks: q.type === "redac" ? q.points.map(() => false) : null }));
  res.forEach(r => { if (r.ok !== null) { updateSkill(r.q.skill.id, r.ok); S.answered++; } });
  touchDay(res.length);
  const entry = { ch: ch.id, date: Date.now(), score: 0, total: res.length, min: Math.round((Date.now() - exam.t0) / 60000) };
  S.tests.push(entry); exam = null;
  const score = () => res.reduce((t, r) => t + (r.ok === null ? r.ticks.filter(Boolean).length / r.ticks.length : r.ok ? 1 : 0), 0);
  const draw = () => {
    entry.score = score(); save();
    const n20 = fmt20(entry);
    const bySkill = {}; res.forEach(r => { const id = r.q.skill.id; bySkill[id] = bySkill[id] || [0, 0]; bySkill[id][1]++; bySkill[id][0] += r.ok === null ? r.ticks.filter(Boolean).length / r.ticks.length : r.ok ? 1 : 0; });
    const weak = Object.entries(bySkill).filter(([, v]) => v[0] / v[1] < 0.75).map(([id]) => RV.skill(id));
    V().innerHTML = `<div class="${ch.subject}c"><div class="center" style="padding-top:16px"><p class="muted">Contrôle blanc · ${ch.title}</p><div class="score">${n20}<span style="font-size:28px">/20</span></div>
    <p class="muted">${entry.min} min · ${res.filter(r => r.ok === null).length ? "corrige tes rédactions plus bas, la note se met à jour" : "bravo d'avoir tout fait sans le cours"}</p></div>
    ${weak.length ? `<div class="card flat" style="margin:14px 0"><h3>À retravailler en priorité</h3>${weak.map(s => `<button class="skill" data-skill="${s.id}"><div class="grow"><div class="nm">${s.name}</div><div class="sh">${s.short}</div></div><span>→</span></button>`).join("")}</div>` : `<div class="card flat" style="margin:14px 0"><b>Aucune compétence sous 75 %.</b> Tu es prête 💪</div>`}
    <h2 style="margin:18px 0 6px">Correction</h2>
    ${res.map((r, i) => `<div class="revq ${r.ok === null ? "" : r.ok ? "good" : "bad"}"><div class="xsmall muted">Question ${i + 1} · ${r.q.skill.name}</div><div class="tableX">${r.q.prompt}</div>${r.q.fig || ""}
      ${r.ok === null ? `${r.a && r.a.text ? `<p class="small muted" style="margin-top:8px">Ta réponse :</p><div class="model" style="white-space:pre-wrap">${esc(r.a.text)}</div>` : ""}<p class="small muted" style="margin-top:8px">Coche les points présents dans ta réponse :</p>${r.q.points.map((p, j) => `<button class="checkpt ${r.ticks[j] ? "on" : ""}" data-r="${i}" data-p="${j}"><span class="box">${r.ticks[j] ? "✓" : ""}</span><span>${p}</span></button>`).join("")}<p class="small muted" style="margin-top:8px">Réponse modèle :</p><div class="model">${r.q.model}</div>`
        : `<div class="small" style="margin-top:6px">${r.ok ? "✅" : "❌"} Ta réponse : <b>${answerOf(r.q, r.a)}</b></div>${r.ok ? "" : `<div class="small">✅ Réponse : <b>${RV.answerText(r.q)}</b></div>`}<div class="small expl" style="margin-top:6px">${r.q.expl}</div>${r.q.trap ? `<div class="trap small">⚠️ ${r.q.trap}</div>` : ""}`}</div>`).join("")}
    <button class="btn block" data-act="done" style="margin-top:16px">Terminer</button></div>`;
    $$("[data-r][data-p]").forEach(b => b.onclick = () => { const r = res[+b.dataset.r], j = +b.dataset.p; r.ticks[j] = !r.ticks[j]; const y = window.scrollY; draw(); window.scrollTo(0, y); });
    $$("[data-skill]").forEach(b => b.onclick = () => startSkill(b.dataset.skill));
    V().querySelector("[data-act=done]").onclick = () => { res.filter(r => r.ok === null).forEach(r => { updateSkill(r.q.skill.id, r.ticks.filter(Boolean).length / r.ticks.length >= 0.75); S.answered++; }); save(); checkBadges(); go("chapter", { id: ch.id, tab: "exam" }); };
  };
  draw(); window.scrollTo(0, 0);
  S.xp += 50; save(); checkBadges();
  if (entry.score / entry.total >= 0.75) confetti();
}
function answerOf(q, a) {
  if (a == null || (Array.isArray(a) && !a.length)) return "(pas de réponse)";
  switch (q.type) {
    case "qcm": case "vf": return q.choices[a];
    case "multi": return a.map(i => q.choices[i]).join(" ; ");
    case "num": return esc(a) + (q.unit ? " " + q.unit : "");
    case "text": return esc(a);
    case "match": return q.left.map((l, i) => l + " → " + (a[i] >= 0 ? q.options[a[i]] : "?")).join("<br>");
    case "order": return a.map(i => q.items[i]).join(" → ");
  }
  return "";
}

/* ---------- progrès ---------- */
function renderProgress() {
  V().innerHTML = `<div class="top"><h1>Mes progrès</h1></div>
  <div class="kpi"><div><b>${streakNow()}</b><span class="small muted">jours d'affilée</span></div><div><b>${S.answered}</b><span class="small muted">questions</span></div><div><b>${S.xp}</b><span class="small muted">XP · ${LEVELS[level()]}</span></div></div>
  ${RV.chapters.map(ch => { const sub = RV.subjects[ch.subject]; const tests = S.tests.filter(t => t.ch === ch.id); return `<div class="card flat ${ch.subject}c" style="margin-top:14px">
    <div class="row"><h3 class="grow">${sub.icon} ${ch.title}</h3><b>${chapterPct(ch)} %</b></div>
    <div class="bar ${ch.subject}" style="margin:8px 0 12px"><i style="width:${chapterPct(ch)}%"></i></div>
    ${ch.skills.map(s => { const c = sk(s.id); return `<div class="row" style="padding:5px 0"><span class="grow small">${s.name}${s.later && !S.includeLater ? ' <span class="tag">après jeudi</span>' : ""}</span><span class="xsmall muted num">${c.seen ? Math.round(c.ok / c.seen * 100) + " %" : ""}</span>${dots(c.lvl)}</div>`; }).join("")}
    <div class="row small" style="margin-top:10px"><span class="grow muted">Cartes bien sues</span><b>${ch.cards.filter(c => cd(c.id).box >= 3).length}/${ch.cards.length}</b></div>
    ${tests.length ? `<div class="row small"><span class="grow muted">Contrôles blancs</span><b>${tests.slice(-5).map(fmt20).join(" · ")}</b></div>` : ""}
  </div>`; }).join("")}
  <h2 style="margin:22px 0 10px">Badges</h2>
  <div class="stack">${BADGES.map(b => `<div class="row card flat" style="padding:10px 14px;${S.badges.includes(b.id) ? "" : "opacity:.45"}"><span style="font-size:24px">${b.icon}</span><span class="grow">${b.name}</span>${S.badges.includes(b.id) ? "✓" : "🔒"}</div>`).join("")}</div>`;
}

/* ---------- réglages ---------- */
function renderSettings() {
  V().innerHTML = `<div class="top"><h1>Réglages</h1></div>
  <div class="card flat">
    <div class="set"><label class="grow" for="nm">Prénom</label><input id="nm" value="${esc(S.name)}" style="height:42px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);padding:0 10px;width:140px"></div>
    ${RV.chapters.map(ch => `<div class="set"><label class="grow" for="d-${ch.examKey}">Date du contrôle de ${RV.subjects[ch.subject].name}</label><input type="date" id="d-${ch.examKey}" data-ex="${ch.examKey}" value="${S.exams[ch.examKey] || ""}"></div>`).join("")}
    <div class="set"><span class="grow">Objectif : questions par jour</span><select id="goal" style="height:42px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);padding:0 8px">${[10, 20, 30, 40].map(n => `<option ${n === S.goal ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="set"><span class="grow">Inclure les tests chimiques et la CCM<br><span class="small muted">(physique-chimie, pas au contrôle de jeudi)</span></span><button class="switch ${S.includeLater ? "on" : ""}" data-sw="includeLater" role="switch" aria-checked="${S.includeLater}" aria-label="Inclure les tests chimiques et la CCM"></button></div>
    <div class="set"><span class="grow">Sons</span><button class="switch ${S.sound ? "on" : ""}" data-sw="sound" role="switch" aria-checked="${S.sound}" aria-label="Sons"></button></div>
    <div class="set"><span class="grow">Thème</span><select id="theme" style="height:42px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);padding:0 8px"><option value="auto">Automatique</option><option value="light">Clair</option><option value="dark">Sombre</option></select></div>
  </div>
  <div class="card flat" style="margin-top:14px"><h3>Installer l'appli</h3><p class="small" style="margin-top:6px">Sur iPhone : dans Safari, bouton Partager puis « Sur l'écran d'accueil ». Sur Android : menu ⋮ de Chrome puis « Ajouter à l'écran d'accueil ». Elle marche ensuite sans réseau.</p></div>
  <div class="card flat" style="margin-top:14px"><h3>Nouveaux chapitres</h3><p class="small" style="margin-top:6px">Chaque nouveau cours (photos du cahier) devient un nouveau chapitre dans l'appli, avec sa fiche, ses cartes, ses exercices et son contrôle blanc. Ta progression est conservée.</p></div>
  <button class="btn ghost block" data-act="reset" style="margin-top:14px;color:var(--ko)">Remettre à zéro toute la progression</button>
  <p class="xsmall muted center" style="margin-top:14px">Révisions 2de · ${RV.chapters.length} chapitres · ${RV.chapters.reduce((t, c) => t + c.skills.length, 0)} compétences · ${RV.chapters.reduce((t, c) => t + c.cards.length, 0)} cartes</p>`;
  $("#theme").value = S.theme;
  $("#nm").onchange = e => { S.name = e.target.value.trim() || "Emma"; save(); };
  $$("[data-ex]").forEach(i => i.onchange = () => { S.exams[i.dataset.ex] = i.value; save(); toast("Date enregistrée"); });
  $("#goal").onchange = e => { S.goal = +e.target.value; save(); };
  $("#theme").onchange = e => { S.theme = e.target.value; applyTheme(); save(); };
  $$("[data-sw]").forEach(b => b.onclick = () => { const k = b.dataset.sw; S[k] = !S[k]; b.classList.toggle("on", S[k]); b.setAttribute("aria-checked", S[k]); save(); });
  V().querySelector("[data-act=reset]").onclick = () => { if (confirm("Effacer toute la progression (XP, niveaux, cartes, contrôles) ? C'est définitif.")) { const keep = { name: S.name, exams: S.exams, theme: S.theme }; S = { ...JSON.parse(JSON.stringify(DEFAULT)), ...keep }; save(); toast("Progression remise à zéro"); go("home"); } };
}

/* ---------- démarrage ---------- */
go("home");
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
