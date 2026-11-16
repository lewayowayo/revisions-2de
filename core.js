/* core.js — outils communs + registre des chapitres (pur, sans DOM : testable avec node).
   Pour ajouter un chapitre : créer un fichier ch-xxx.js qui appelle RV.addChapter({...}) et l'ajouter dans index.html, sw.js et test/run.js. */
(function (root) {
  const RV = root.RV = root.RV || {};
  RV.chapters = [];
  RV.subjects = {
    svt: { id: "svt", name: "SVT", long: "Sciences de la vie et de la Terre", color: "svt", icon: "🧬" },
    pc: { id: "pc", name: "Physique-chimie", long: "Physique-chimie", color: "pc", icon: "⚗️" },
  };
  RV.addChapter = ch => { ch.skills.forEach(s => { s.chapter = ch.id; s.subject = ch.subject; }); RV.chapters.push(ch); };
  RV.chapter = id => RV.chapters.find(c => c.id === id);
  RV.allSkills = () => RV.chapters.flatMap(c => c.skills);
  RV.skill = id => RV.allSkills().find(s => s.id === id);

  /* ---------- hasard ---------- */
  const rnd = RV.rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = RV.pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = RV.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  RV.sample = (a, n) => shuffle(a).slice(0, n);

  /* ---------- nombres à la française ---------- */
  // arrondi à n chiffres significatifs, sans écriture scientifique
  RV.sig = (x, n = 3) => { if (x === 0) return 0; const p = Math.pow(10, n - Math.ceil(Math.log10(Math.abs(x)))); return Math.round(x * p) / p; };
  RV.round = (x, d = 2) => Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
  RV.fmt = (x, d) => {
    let v = d == null ? RV.sig(x, 4) : RV.round(x, d);
    let s = String(v);
    if (/e/.test(s)) s = v.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
    const [i, f] = s.replace("-", "").split(".");
    const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (v < 0 ? "−" : "") + int + (f ? "," + f : "");
  };
  RV.parseNum = s => {
    if (s == null) return null;
    s = String(s).trim().replace(/[\s  ]+/g, "").replace(/[−–]/g, "-").replace(/,/g, ".");
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
    return parseFloat(s);
  };
  // tolérance relative (par défaut 1 %) pour accepter les arrondis raisonnables
  RV.numOk = (given, expected, tol = 0.01) => given != null && Math.abs(given - expected) <= Math.max(Math.abs(expected) * tol, 1e-9);

  /* ---------- texte ---------- */
  RV.norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9+\- ]/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b(le|la|les|l|un|une|des|du|de|d)\b /g, "").trim();
  RV.textOk = (given, answers) => { const g = RV.norm(given); return g.length > 0 && answers.some(a => RV.norm(a) === g); };
  RV.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- fabrique de questions ----------
     Types : qcm (une réponse), multi (plusieurs), vf, num, text, match, order, redac
     Champs communs : prompt (HTML), fig (SVG), expl (correction), trap (piège à retenir) */
  RV.qcm = (prompt, good, bads, expl, extra = {}) => {
    const choices = shuffle([good, ...bads]);
    return { type: "qcm", prompt, choices, answer: choices.indexOf(good), expl, ...extra };
  };
  RV.multi = (prompt, goods, bads, expl, extra = {}) => {
    const choices = shuffle([...goods, ...bads]);
    return { type: "multi", prompt, choices, answer: goods.map(g => choices.indexOf(g)).sort((a, b) => a - b), expl, ...extra };
  };
  RV.vf = (prompt, truth, expl, extra = {}) => ({ type: "vf", prompt, choices: ["Vrai", "Faux"], answer: truth ? 0 : 1, expl, ...extra });
  RV.num = (prompt, value, unit, expl, extra = {}) => ({ type: "num", prompt, answer: value, unit, tol: 0.02, expl, ...extra });
  RV.text = (prompt, answers, expl, extra = {}) => ({ type: "text", prompt, answers, expl, ...extra });
  RV.match = (prompt, pairs, expl, extra = {}) => {
    // pairs : [[gauche, droite], ...] ; les droites peuvent se répéter
    const options = shuffle([...new Set(pairs.map(p => p[1]).concat(extra.distractors || []))]);
    return { type: "match", prompt, left: pairs.map(p => p[0]), options, answer: pairs.map(p => options.indexOf(p[1])), expl, ...extra };
  };
  RV.order = (prompt, items, expl, extra = {}) => {
    let shown = shuffle(items);
    if (items.length > 1) while (shown.every((x, i) => x === items[i])) shown = shuffle(items);
    return { type: "order", prompt, items: shown, answer: items.map(x => shown.indexOf(x)), expl, ...extra };
  };
  RV.redac = (prompt, points, model, extra = {}) => ({ type: "redac", prompt, points, model, ...extra });

  /* ---------- correction ---------- */
  RV.check = (q, a) => {
    switch (q.type) {
      case "qcm": case "vf": return a === q.answer;
      case "multi": { const s = (a || []).slice().sort((x, y) => x - y); return s.length === q.answer.length && s.every((v, i) => v === q.answer[i]); }
      case "num": return RV.numOk(RV.parseNum(a), q.answer, q.tol);
      case "text": return RV.textOk(a, q.answers);
      case "match": return Array.isArray(a) && a.length === q.answer.length && a.every((v, i) => v === q.answer[i] || q.options[v] === q.options[q.answer[i]]);
      case "order": return Array.isArray(a) && a.every((v, i) => q.items[v] === q.items[q.answer[i]]);
      case "redac": return a >= 0.75; // a = part des points cochés
    }
    return false;
  };
  RV.answerText = q => {
    switch (q.type) {
      case "qcm": case "vf": return q.choices[q.answer];
      case "multi": return q.answer.map(i => q.choices[i]).join(" ; ");
      case "num": return RV.fmt(q.answer) + (q.unit ? " " + q.unit : "");
      case "text": return q.answers[0];
      case "match": return q.left.map((l, i) => l + " → " + q.options[q.answer[i]]).join("<br>");
      case "order": return q.answer.map(i => q.items[i]).join(" → ");
      case "redac": return q.model;
    }
  };

  /* ---------- briques de dessin SVG (couleurs via variables CSS) ---------- */
  RV.svg = (w, h, body, label) => `<svg class="fig" viewBox="0 0 ${w} ${h}" role="img" aria-label="${RV.esc(label || "schéma")}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  // Graphique simple : séries de points, axes gradués, bandes (lumière / obscurité…)
  RV.plot = o => {
    const W = o.w || 340, H = o.h || 210, L = 44, R = 12, T = 14, B = 38;
    const xmax = o.xmax, ymin = o.ymin || 0, ymax = o.ymax;
    const X = x => L + (x / xmax) * (W - L - R), Y = y => H - B - ((y - ymin) / (ymax - ymin)) * (H - T - B);
    let s = "";
    (o.bands || []).forEach(b => { s += `<rect x="${X(b.x0)}" y="${T}" width="${X(b.x1) - X(b.x0)}" height="${H - T - B}" class="band ${b.cls || ""}"/><text x="${(X(b.x0) + X(b.x1)) / 2}" y="${T + 12}" class="t sm" text-anchor="middle">${b.label}</text>`; });
    (o.yticks || []).forEach(v => { s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>` + (!o.yLabelStep || v % o.yLabelStep === 0 ? `<text x="${L - 5}" y="${Y(v) + 4}" class="t sm" text-anchor="end">${RV.fmt(v)}</text>` : ""); });
    (o.xticks || []).forEach(v => { s += `<line x1="${X(v)}" x2="${X(v)}" y1="${H - B}" y2="${H - B + 4}" class="axis"/><text x="${X(v)}" y="${H - B + 15}" class="t sm" text-anchor="middle">${RV.fmt(v)}</text>`; });
    s += `<line x1="${L}" y1="${T - 4}" x2="${L}" y2="${H - B}" class="axis"/><line x1="${L}" y1="${H - B}" x2="${W - R + 4}" y2="${H - B}" class="axis"/>`;
    s += `<text x="${(L + W - R) / 2}" y="${H - 4}" class="t sm" text-anchor="middle">${o.xlabel || ""}</text>`;
    s += `<text x="12" y="${(T + H - B) / 2}" class="t sm" text-anchor="middle" transform="rotate(-90 12 ${(T + H - B) / 2})">${o.ylabel || ""}</text>`;
    o.series.forEach((se, i) => {
      s += `<polyline fill="none" class="ser ${se.cls || "s" + (i + 1)}" points="${se.pts.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ")}"/>`;
      if (se.name) { const p = se.pts[se.pts.length - 1]; s += `<text x="${X(p[0]) - 2}" y="${Y(p[1]) - 6}" class="t sm b ${se.cls || "s" + (i + 1)}t" text-anchor="end">${se.name}</text>`; }
    });
    return RV.svg(W, H, s, o.label || "graphique");
  };
  RV.arrowDefs = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker></defs>`;
})(typeof window !== "undefined" ? window : globalThis);
