// node test/run.js — génère des milliers de questions et vérifie qu'elles sont cohérentes
const path = require("path");
["core.js", "ch-svt-a3.js", "ch-pc-c2.js"].forEach(f => require(path.join(__dirname, "..", f)));
const RV = globalThis.RV;
let n = 0, errs = [];
const fail = (s, lvl, msg, q) => { if (errs.length < 30) errs.push(`${s.id} lvl${lvl}: ${msg}\n   ${String(q && q.prompt).slice(0, 160)}`); };
for (const ch of RV.chapters) {
  if (!ch.lesson.length || !ch.cards.length) fail({ id: ch.id }, 0, "leçon ou cartes vides");
  for (const [id] of [...ch.exam, ...(ch.examLater || [])]) if (!RV.skill(id)) fail({ id }, 0, "compétence d'examen inconnue");
  for (const s of ch.skills) {
    if (!ch.lesson.find(l => l.id === s.lesson)) fail(s, 0, "leçon liée introuvable");
    for (let lvl = 0; lvl <= 5; lvl++) for (let i = 0; i < 400; i++) {
      let q; try { q = s.gen(lvl); } catch (e) { fail(s, lvl, "exception " + e.message); continue; }
      n++;
      if (!q || !q.type || !q.prompt) { fail(s, lvl, "question vide", q); continue; }
      if (/undefined|NaN|\[object/.test(q.prompt + (q.expl || "") + (q.model || "") + JSON.stringify(q.choices || q.options || q.items || ""))) fail(s, lvl, "texte contient undefined/NaN", q);
      if (q.type !== "redac" && !q.expl) fail(s, lvl, "pas de correction", q);
      if (["qcm", "vf"].includes(q.type)) { if (!(q.answer >= 0 && q.answer < q.choices.length)) fail(s, lvl, "réponse hors choix", q); if (new Set(q.choices).size !== q.choices.length) fail(s, lvl, "choix en double: " + q.choices.join(" | "), q); if (!RV.check(q, q.answer)) fail(s, lvl, "check(answer) faux", q); }
      if (q.type === "multi") { if (q.answer.some(a => a < 0) || !q.answer.length) fail(s, lvl, "multi réponse invalide", q); if (new Set(q.choices).size !== q.choices.length) fail(s, lvl, "choix en double", q); if (!RV.check(q, q.answer)) fail(s, lvl, "check faux", q); }
      if (q.type === "num") { if (!isFinite(q.answer)) fail(s, lvl, "num non fini", q); if (!RV.check(q, RV.fmt(q.answer))) fail(s, lvl, "fmt(answer) refusé: " + RV.fmt(q.answer) + " vs " + q.answer, q); }
      if (q.type === "text" && !RV.check(q, q.answers[0])) fail(s, lvl, "text answer refusé", q);
      if (q.type === "match") { if (q.answer.some(a => a < 0)) fail(s, lvl, "match invalide", q); if (!RV.check(q, q.answer)) fail(s, lvl, "match check", q); }
      if (q.type === "order" && !RV.check(q, q.answer)) fail(s, lvl, "order check", q);
      if (q.type === "redac" && (!q.points.length || !q.model)) fail(s, lvl, "redac incomplet", q);
      if (q.type === "qcm" && q.choices.length < 2) fail(s, lvl, "qcm < 2 choix", q);
    }
  }
}
// vérifications indépendantes de quelques calculs
const ok = (c, m) => { if (!c) errs.push("calcul: " + m); };
ok(RV.parseNum("0,25") === 0.25, "parseNum virgule"); ok(RV.parseNum("1 000") === 1000, "parseNum espace"); ok(RV.fmt(0.025) === "0,025", "fmt 0,025"); ok(RV.fmt(39000) === "39 000", "fmt milliers");
ok(RV.textOk("la Mitochondrie", ["mitochondrie"]), "textOk article"); ok(RV.textOk("voie metabolique", ["voie métabolique"]), "textOk accents");
console.log(`${n} questions générées, ${errs.length} problème(s)`);
errs.forEach(e => console.log(" ✗ " + e));
process.exit(errs.length ? 1 : 0);
