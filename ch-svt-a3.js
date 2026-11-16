/* ch-svt-a3.js — SVT, chapitre A3 : le fonctionnement de l'organisme, résultat du métabolisme des cellules spécialisées */
(function (root) {
  const RV = root.RV;
  const { pick, rnd, shuffle, sample, qcm, multi, vf, num, text, match, order, redac, svg } = RV;
  const chem = s => s.replace(/([A-Za-z)])(\d+)/g, "$1<sub>$2</sub>");
  const chemS = s => s.replace(/([A-Za-z)])(\d+)/g, '$1<tspan baseline-shift="sub" font-size="75%">$2</tspan>'); // indices dans un SVG

  /* =========================================================
     DONNÉES DU COURS
     ========================================================= */
  const VOIES = {
    resp: {
      name: "respiration cellulaire", Name: "Respiration cellulaire",
      eq: "C6H12O6 + 6 O2 → 6 H2O + 6 CO2",
      subs: "glucose + dioxygène (C6H12O6 + 6 O2)", prods: "eau + dioxyde de carbone + molécules énergétiques",
      cond: "présence de glucose et de dioxygène dans le milieu", loc: "dans les mitochondries",
      ins: ["glucose", "+ O2"], outs: ["H2O", "+ CO2"], inside: "Molécules énergétiques", org: "mito",
    },
    photo: {
      name: "photosynthèse", Name: "Photosynthèse",
      eq: "6 CO2 + 6 H2O → C6H12O6 + 6 O2",
      subs: "dioxyde de carbone + eau (6 CO2 + 6 H2O)", prods: "glucose + dioxygène",
      cond: "présence de lumière, d'eau et de dioxyde de carbone", loc: "dans les chloroplastes",
      ins: ["H2O", "+ CO2"], outs: ["O2"], inside: "glucose", org: "chloro", light: true,
    },
    ferm: {
      name: "fermentation alcoolique", Name: "Fermentation alcoolique",
      eq: "C6H12O6 → 2 CO2 + éthanol",
      subs: "glucose (C6H12O6)", prods: "dioxyde de carbone + éthanol + molécules énergétiques",
      cond: "présence de glucose (pas besoin de dioxygène)", loc: "dans le cytoplasme",
      ins: ["glucose"], outs: ["CO2 +", "éthanol"], inside: "Molécules énergétiques", org: null,
    },
  };
  const VKEYS = ["resp", "photo", "ferm"];

  /* =========================================================
     SCHÉMAS
     ========================================================= */
  function cellDiag(v, opt = {}) {
    const d = typeof v === "string" ? VOIES[v] : v;
    const hide = opt.hideInside;
    let s = RV.arrowDefs("ah");
    s += `<text x="8" y="18" class="t sm muted">Milieu</text><text x="232" y="52" class="t sm">Cellule</text>`;
    s += `<circle cx="170" cy="110" r="66" class="cell"/>`;
    if (d.light && !hide) s += `<text x="112" y="24" class="t sm b warmt">☀ Lumière</text><path d="M128 30 L140 52" class="arrow" marker-end="url(#ah)"/>`;
    if (d.org === "mito" && !hide) s += `<ellipse cx="170" cy="100" rx="48" ry="24" class="org mito"/><text x="106" y="172" class="t xs muted" text-anchor="end">mitochondrie</text><path d="M108 168 L136 120" class="arrow"/>`;
    if (d.org === "chloro" && !hide) s += `<ellipse cx="170" cy="100" rx="48" ry="24" class="org chloro"/><text x="106" y="172" class="t xs muted" text-anchor="end">chloroplaste</text><path d="M108 168 L136 120" class="arrow"/>`;
    s += `<text x="170" y="96" class="t sm" text-anchor="middle">Réactions</text><text x="170" y="110" class="t sm" text-anchor="middle">métaboliques</text>`;
    // entrées (flèches pleines) / sorties (flèches pointillées)
    d.ins.forEach((t, i) => { s += `<text x="10" y="${100 + i * 18}" class="t b">${chemS(t)}</text>`; });
    s += `<path d="M66 106 L112 106" class="arrow thick" marker-end="url(#ah)"/>`;
    d.outs.forEach((t, i) => { s += `<text x="282" y="${100 + i * 18}" class="t b">${chemS(t)}</text>`; });
    s += `<path d="M226 106 L276 106" class="arrow thick dash" marker-end="url(#ah)"/>`;
    if (!hide) { s += `<path d="M170 120 L170 152" class="arrow dash" marker-end="url(#ah)"/><text x="170" y="168" class="t sm b" text-anchor="middle">${d.inside}</text>`; }
    else s += `<text x="170" y="160" class="t b" text-anchor="middle">?</text>`;
    return svg(340, 190, s, "schéma des échanges d'une cellule avec son milieu");
  }
  const mitoSvg = (w = 170) => svg(170, 100, `<ellipse cx="85" cy="50" rx="78" ry="42" class="org mito"/><path d="M20 50 C 30 20, 40 75, 52 40 S 70 75, 82 32 S 100 78, 112 38 S 132 72, 150 48" class="crete"/>`, "mitochondrie");
  const chloroSvg = () => svg(170, 100, `<ellipse cx="85" cy="50" rx="78" ry="42" class="org chloro"/><ellipse cx="85" cy="50" rx="70" ry="35" class="org chloro2"/>` + [30, 40, 50, 60, 70].map(y => `<line x1="${36 + Math.abs(50 - y) * 0.9}" x2="${134 - Math.abs(50 - y) * 0.9}" y1="${y}" y2="${y}" class="thyla"/>`).join(""), "chloroplaste");

  function enzymeSvg() {
    const enz = (x, y, cls = "enz") => `<path d="M${x - 20} ${y - 18} A26 26 0 1 0 ${x + 20} ${y - 18} L${x + 10} ${y - 18} L${x + 10} ${y - 2} L${x - 10} ${y - 2} L${x - 10} ${y - 18} Z" class="${cls}"/>`;
    let s = RV.arrowDefs("ae");
    s += enz(40, 58) + `<text x="40" y="104" class="t xs" text-anchor="middle">Enzyme</text>`;
    s += `<text x="76" y="58" class="t b">+</text><rect x="90" y="36" width="18" height="18" class="subs"/><text x="99" y="104" class="t xs" text-anchor="middle">Substrat</text>`;
    s += `<path d="M120 52 L146 52" class="arrow" marker-end="url(#ae)"/>`;
    s += enz(178, 58) + `<rect x="169" y="38" width="18" height="18" class="subs"/><text x="178" y="104" class="t xs" text-anchor="middle">Complexe</text>`;
    s += `<path d="M212 52 L238 52" class="arrow" marker-end="url(#ae)"/>`;
    s += enz(272, 58) + `<text x="272" y="104" class="t xs" text-anchor="middle">Enzyme intacte</text>`;
    s += `<text x="306" y="58" class="t b">+</text><path d="M318 54 L338 54 L338 34 Z" class="prod"/><text x="330" y="104" class="t xs" text-anchor="middle">Produit</text>`;
    return svg(350, 112, s, "action d'une enzyme : substrat transformé en produit");
  }

  // gel d'immunodiffusion : présents = liste des enzymes reconnues (P, R, F)
  function gelSvg(present, central = "L") {
    const cx = 170, cy = 112, wells = { T: 135, F: 45, R: 225, P: 315 };
    let s = `<circle cx="${cx}" cy="${cy}" r="98" class="gel"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="15" class="well c"/><text x="${cx}" y="${cy + 5}" class="t b" text-anchor="middle">${central}</text>`;
    Object.entries(wells).forEach(([k, deg]) => {
      const a = deg * Math.PI / 180, x = cx + 62 * Math.cos(a), y = cy - 62 * Math.sin(a);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" class="well"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" class="t b" text-anchor="middle">${k}</text>`;
      if (present.includes(k)) {
        const mx = cx + 33 * Math.cos(a), my = cy - 33 * Math.sin(a), px = -Math.sin(a), py = -Math.cos(a), L = 15;
        const x1 = mx + px * L, y1 = my + py * L, x2 = mx - px * L, y2 = my - py * L, qx = mx + 7 * Math.cos(a), qy = my - 7 * Math.sin(a);
        s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" class="arc"/>`;
      }
    });
    return svg(340, 224, s, "gel d'immunodiffusion");
  }
  const GEL_LEGEND = c => `<p class="legend">Puits central <b>${c}</b> : contenu des cellules (filtrat). <b>P</b>, <b>R</b>, <b>F</b> : anticorps anti-enzyme de la <b>P</b>hotosynthèse, de la <b>R</b>espiration, de la <b>F</b>ermentation. <b>T</b> : eau (témoin).</p>`;

  // petit graphique de concentrations (mesures en bioréacteur)
  function bioGraph(sc) {
    const trend = (t, x) => t === "up" ? 3 + 4 * x : t === "down" ? 7 - 4 * x : t === "flat" ? 5 + 0.05 * Math.sin(x * 9) : 0;
    const series = [];
    const N = 10;
    if (sc.o2) series.push({ name: "O₂", cls: "s1", pts: Array.from({ length: N + 1 }, (_, i) => [i, sc.o2 === "zero" ? 0.15 : trend(sc.o2, i / N)]) });
    if (sc.co2) series.push({ name: "CO₂", cls: "s2", pts: Array.from({ length: N + 1 }, (_, i) => [i, trend(sc.co2, i / N) - 0.6]) });
    if (sc.eth) series.push({ name: "éthanol", cls: "s3", pts: Array.from({ length: N + 1 }, (_, i) => [i, sc.eth === "up" ? 0.4 + 5 * i / N : 0.4]) });
    return RV.plot({ xmax: 10, ymax: 8.5, xlabel: "temps (min)", ylabel: "concentration", series, xticks: [0, 5, 10] });
  }

  /* =========================================================
     LEÇON (fiche de cours) — reprend le cahier d'Emma
     ========================================================= */
  const lesson = [
    {
      id: "intro", title: "Le métabolisme : de quoi on parle ?", html: () => `
<p class="pb"><b>Problématique :</b> comment les cellules se procurent et transforment la matière, puis produisent l'énergie nécessaires à leurs activités et donc au fonctionnement de l'organisme ?</p>
<div class="def"><b>Voie métabolique</b> : une succession de réactions biochimiques qui transforment une molécule en une autre.<div class="chain">molécule A → molécule B → molécule C</div></div>
<div class="def"><b>Métabolisme de la cellule</b> : l'ensemble de ses voies métaboliques. Il est indispensable à sa survie.</div>
<p>Pour son métabolisme, une cellule réalise des <b>échanges de matière</b> (minérale ou organique) avec son milieu (environnement, autre cellule, autre organisme), à travers sa <b>membrane plasmique perméable</b>.</p>
<div class="two">
  <div class="tile"><b>Molécule organique</b><br>fabriquée par les êtres vivants<br><span class="ex">glucose C₆H₁₂O₆, éthanol, amidon, protéines, lipides</span></div>
  <div class="tile"><b>Molécule minérale</b><br>du monde non vivant<br><span class="ex">CO₂, H₂O, O₂, sels minéraux</span></div>
</div>
<p class="trap">⚠️ Le CO₂ contient du carbone mais c'est une molécule <b>minérale</b>.</p>` },
    {
      id: "voies", title: "Les 3 voies métaboliques (tableau à savoir par cœur)", html: () => `
<p>Le tableau du cours, voie par voie. Les flèches <b>pleines</b> = molécules consommées (substrats), les flèches <b>pointillées</b> = molécules produites.</p>
${VKEYS.map(k => { const v = VOIES[k]; return `<div class="voie ${k}"><h4>${v.Name}</h4>
<div class="eq">${chem(v.eq)}</div>${cellDiag(k)}
<dl><dt>Consommées (substrats)</dt><dd>${chem(v.subs)}</dd><dt>Produites</dt><dd>${v.prods}</dd><dt>Conditions</dt><dd>${v.cond}</dd><dt>Où ?</dt><dd><b>${v.loc}</b></dd></dl></div>`; }).join("")}
<p class="tip">💡 Astuce : l'équation de la <b>photosynthèse</b> est celle de la <b>respiration</b> à l'envers. Respiration : glucose + O₂ → CO₂ + H₂O. Photosynthèse : CO₂ + H₂O → glucose + O₂ (grâce à la lumière).</p>
<p class="tip">💡 La respiration et la fermentation produisent des <b>molécules énergétiques</b> (l'énergie utilisable par la cellule). La photosynthèse, elle, produit du <b>glucose</b> (de la matière organique).</p>
<p class="small muted">Équation de la fermentation équilibrée (pour info) : C₆H₁₂O₆ → 2 CO₂ + 2 C₂H₆O (éthanol).</p>` },
    {
      id: "organites", title: "Les organites : mitochondrie et chloroplaste", html: () => `
<div class="two"><div class="tile center">${mitoSvg()}<b>Mitochondrie</b> (M)<br>repli interne de la membrane<br>➜ <b>respiration cellulaire</b></div>
<div class="tile center">${chloroSvg()}<b>Chloroplaste</b> (C)<br>empilements de membranes, vert<br>➜ <b>photosynthèse</b></div></div>
<p>La <b>fermentation</b> n'a pas besoin d'organite : elle se déroule dans le <b>cytoplasme</b>.</p>
<p>Les cellules végétales chlorophylliennes possèdent <b>à la fois</b> des chloroplastes et des mitochondries.</p>` },
    {
      id: "auto", title: "Cellules chlorophylliennes : métabolisme autotrophe", html: () => `
<div class="def">Les cellules <b>chlorophylliennes</b> (cellules de feuille, algues comme la chlorelle) ont un <b>métabolisme autotrophe</b> : elles fabriquent leur propre matière organique (glucose) à partir de <b>matière minérale</b> (CO₂, H₂O, sels minéraux) en utilisant l'<b>énergie de la lumière</b> : c'est la <b>photosynthèse</b>, dans les <b>chloroplastes</b>.</div>
<p>Elles possèdent aussi des <b>mitochondries</b> : elles font donc <b>aussi la respiration cellulaire</b>, le jour comme la nuit. Elles utilisent le glucose qu'elles ont fabriqué.</p>
<p class="trap">⚠️ Piège classique : « la plante fait la photosynthèse le jour et respire la nuit ». Faux : elle <b>respire tout le temps</b>. Le jour, la photosynthèse est plus intense, donc on mesure surtout un rejet d'O₂.</p>
<p class="small muted">Cette partie (2) n'était pas sur les photos du cahier : elle est rédigée à partir du programme de seconde. À vérifier avec le cahier d'Emma.</p>` },
    {
      id: "hetero", title: "Cellules non chlorophylliennes : métabolisme hétérotrophe", html: () => `
<div class="def">Le <b>métabolisme hétérotrophe</b> est un ensemble de réactions qui permettent à une cellule de transformer des <b>molécules organiques</b> (comme le glucose) <b>prélevées dans le milieu</b> afin de produire d'autres molécules organiques et des <b>molécules énergétiques</b> indispensables aux réactions cellulaires.</div>
<p>Deux voies sont possibles :</p>
<ul><li>la <b>respiration cellulaire</b> si <b>présence de O₂ et de mitochondries</b> ;</li><li>la <b>fermentation</b> si <b>absence de O₂</b> (ou de mitochondries).</li></ul>
<p>Il concerne les cellules <b>animales</b>, les cellules <b>végétales non chlorophylliennes</b> (racine, pétale blanc…) et les cellules de <b>champignons</b> (comme les levures), qui <b>ne possèdent pas de chloroplastes</b>.</p>
<table class="mini"><tr><th>Cellule</th><th>Métabolisme</th><th>Voies possibles</th></tr>
<tr><td>Cellule de feuille, chlorelle</td><td>autotrophe</td><td>photosynthèse + respiration</td></tr>
<tr><td>Cellule de racine, de pétale blanc</td><td>hétérotrophe</td><td>respiration</td></tr>
<tr><td>Cellule animale (muscle, foie…)</td><td>hétérotrophe</td><td>respiration</td></tr>
<tr><td>Levure (champignon)</td><td>hétérotrophe</td><td>respiration (avec O₂) ou fermentation (sans O₂)</td></tr></table>` },
    {
      id: "tp7", title: "TP7 : quelle voie utilisent les levures en culture ?", html: () => `
<p>Deux souches de levures : <b>Rho⁺</b> (mitochondries fonctionnelles) et <b>Rho⁻</b> (mitochondries non fonctionnelles).</p>
<div class="grid4"><div><b>1. Ce que je cherche</b><br>Identifier chacune des souches.</div><div><b>2. Ce que je sais</b><br>Rho⁺ est capable de faire la respiration cellulaire, Rho⁻ ne peut pas.</div><div><b>3. Ce que je fais</b><br>Je leur donne les molécules permettant la respiration (glucose + O₂) et je mesure O₂, CO₂, éthanol.</div><div><b>4. Attendus</b><br>Une doit réaliser la respiration (Rho⁺), l'autre ne peut pas.</div></div>
<div class="two"><div class="tile"><b>Rho⁺</b> : O₂ ↓, CO₂ ↑<br>➜ <b>respiration</b></div><div class="tile"><b>Rho⁻</b> : O₂ constant, CO₂ ↑, éthanol ↑<br>➜ <b>fermentation</b></div></div>
<p class="tip">Rédaction type : « <i>Je sais que</i> ces échanges correspondent à ceux de la voie métabolique de la respiration cellulaire. <i>J'en déduis que</i> ces cellules réalisent la respiration. »</p>` },
    {
      id: "enzymes", title: "Les enzymes, spécifiques de chaque voie", html: () => `
<p>Les différentes voies métaboliques nécessitent des <b>enzymes spécifiques</b>.</p>
<div class="def">Une <b>enzyme</b> est une <b>macromolécule</b> capable d'<b>accélérer une réaction chimique</b>, en permettant la transformation du <b>substrat</b> en <b>produit(s)</b>. Elle est <b>spécifique de son substrat</b>, ne permet la réalisation que d'<b>un seul type</b> de réaction, et reste <b>intacte</b> à la fin de la réaction.</div>
${enzymeSvg()}
<div class="chain">S —<small>enzyme</small>→ P</div>
<p>Dans une voie métabolique, le <b>produit</b> d'une réaction devient le <b>substrat</b> de la suivante : Substrat A —enzyme 1→ Produit B = Substrat B —enzyme 2→ Produit C = Substrat C —enzyme 3→ Produit D.</p>` },
    {
      id: "tp8", title: "TP8 : le test d'immunodiffusion", html: () => `
<p><b>Question :</b> comment vérifier que les cellules possèdent des enzymes différentes, leur permettant de réaliser des voies métaboliques spécifiques ?</p>
<ol><li>On recherche dans les cellules (chlorelles, levures) la présence des <b>enzymes P, R ou F</b>.</li>
<li>On fait un test d'immunodiffusion entre le <b>filtrat</b> de cellules et des solutions d'<b>anticorps</b> qui se fixent chacun sur une des 3 enzymes.<br>➜ filtrat dans le <b>puits central</b>, anticorps dans les <b>puits périphériques</b>, <b>eau</b> dans un puits périphérique = <b>témoin négatif</b>.</li>
<li>Si un <b>arc de précipitation</b> se forme entre le puits central et un puits d'anticorps ➜ l'<b>enzyme</b> recherchée est <b>présente</b> dans le filtrat. Les arcs se forment à des puits différents selon le filtrat (chlorelles ou levures).</li></ol>
${gelSvg(["F", "R"])}${GEL_LEGEND("L (levures)")}
<p><b>Résultat (levures) :</b> deux arcs, avec les anti-enzymes <b>F</b> et <b>R</b>. Les enzymes F et R sont présentes dans les levures (pas P). Les chlorelles, elles, ont P et R.</p>
<p><b>Conclusion :</b> chlorelles et levures possèdent des enzymes différentes. Les enzymes étant spécifiques des voies métaboliques, la levure peut faire la fermentation et la respiration, la chlorelle la photosynthèse et la respiration.</p>` },
    {
      id: "bilan", title: "Bilan et flux de matière et d'énergie", html: () => `
<div class="def"><b>Bilan :</b> les voies métaboliques peuvent être différentes selon les <b>organites</b> et les <b>enzymes spécifiques</b> que les cellules possèdent, ce qui explique leurs <b>fonctions spécialisées</b>.</div>
<p><b>Des flux de matière et d'énergie permanents :</b> au sein d'une cellule ou d'un organisme, les réactions formant les voies métaboliques sont <b>interconnectées</b> entre elles par des <b>molécules intermédiaires</b>.</p>
<p>Exemple : le glucose produit par la photosynthèse (chloroplaste) est utilisé par la respiration (mitochondrie) de la même cellule ou d'autres cellules de la plante. Le glucose est la molécule qui relie les deux voies.</p>` },
  ];

  /* =========================================================
     MÉTHODES ET PIÈGES
     ========================================================= */
  const methods = [
    {
      id: "m-redac", title: "Rédiger une réponse en SVT (je sais que / j'observe / j'en déduis)", html: () => `
<p>Au contrôle, on n'attend pas seulement la bonne réponse : il faut <b>montrer le raisonnement</b>. Trois étapes :</p>
<ol class="steps"><li><b>J'observe que…</b> (je décris les données avec des valeurs ou des tendances : « la concentration en O₂ diminue de 8 à 2 mg/L »)</li>
<li><b>Je sais que…</b> (je rappelle une connaissance du cours : « la respiration consomme du O₂ et rejette du CO₂ »)</li>
<li><b>J'en déduis que…</b> (je conclus en répondant à la question posée : « ces cellules réalisent la respiration cellulaire »)</li></ol>
<div class="example"><b>Exemple.</b> Des levures sont placées sans O₂ avec du glucose. On mesure une augmentation de CO₂ et l'apparition d'éthanol.<br>
<i>J'observe que</i> le CO₂ augmente et que de l'éthanol apparaît, sans dioxygène. <i>Je sais que</i> la fermentation alcoolique consomme du glucose et produit du CO₂ et de l'éthanol, sans besoin de O₂. <i>J'en déduis que</i> les levures réalisent la fermentation alcoolique.</div>` },
    {
      id: "m-graph", title: "Identifier une voie à partir de mesures", html: () => `
<table class="mini"><tr><th>Ce qu'on mesure</th><th>Voie</th></tr>
<tr><td>O₂ ↓ et CO₂ ↑</td><td>respiration</td></tr>
<tr><td>O₂ ↑ et CO₂ ↓ (à la lumière)</td><td>photosynthèse</td></tr>
<tr><td>éthanol ↑ et CO₂ ↑, O₂ absent ou constant</td><td>fermentation</td></tr></table>
<p class="trap">⚠️ Le CO₂ augmente pour la respiration <b>et</b> pour la fermentation. Pour trancher, regarde le <b>O₂</b> (consommé ou non) et l'<b>éthanol</b>.</p>
<p class="trap">⚠️ Une cellule chlorophyllienne à l'<b>obscurité</b> ne fait plus la photosynthèse, mais elle respire : O₂ ↓, CO₂ ↑.</p>` },
    {
      id: "m-gel", title: "Lire un gel d'immunodiffusion", html: () => `
<ol class="steps"><li>Je repère ce qu'il y a dans le <b>puits central</b> (le filtrat de cellules) et dans chaque puits périphérique (les anticorps).</li>
<li>Je vérifie le <b>témoin</b> (eau) : pas d'arc, normal, ça montre que l'eau seule ne fait pas d'arc.</li>
<li>Un <b>arc</b> entre le centre et un puits d'anticorps anti-X ➜ l'<b>enzyme X est présente</b> dans les cellules.</li>
<li>J'en déduis la <b>voie</b> : enzyme P ➜ photosynthèse ; R ➜ respiration ; F ➜ fermentation.</li></ol>
<p class="trap">⚠️ L'arc montre la présence de l'<b>enzyme</b> dans le filtrat, pas celle de l'anticorps (l'anticorps, c'est nous qui l'avons mis).</p>` },
    {
      id: "m-traps", title: "Les 10 pièges à éviter", html: () => `
<ol class="steps">
<li>CO₂, H₂O, O₂ sont des molécules <b>minérales</b> ; le glucose est <b>organique</b>.</li>
<li>Les cellules chlorophylliennes font <b>aussi</b> la respiration (elles ont des mitochondries).</li>
<li>La fermentation se fait dans le <b>cytoplasme</b>, pas dans un organite.</li>
<li>La respiration se fait dans les <b>mitochondries</b>, la photosynthèse dans les <b>chloroplastes</b>.</li>
<li>Les cellules animales n'ont <b>jamais</b> de chloroplastes.</li>
<li>Une enzyme reste <b>intacte</b> : elle n'est ni consommée ni détruite.</li>
<li>Une enzyme est <b>spécifique</b> : un seul substrat, un seul type de réaction.</li>
<li>Substrat = ce qui est <b>consommé</b> ; produit = ce qui est <b>fabriqué</b>.</li>
<li>La photosynthèse a besoin de <b>lumière</b> ; la respiration de <b>O₂</b> ; la fermentation seulement de <b>glucose</b>.</li>
<li>Dans une voie métabolique, le produit d'une réaction est le <b>substrat de la suivante</b>.</li></ol>` },
  ];

  /* =========================================================
     CARTES MÉMOIRE
     ========================================================= */
  const cards = [
    ["Voie métabolique", "Succession de réactions biochimiques qui transforment une molécule en une autre."],
    ["Métabolisme de la cellule", "Ensemble des voies métaboliques de la cellule, indispensable à sa survie."],
    ["À travers quoi la cellule échange-t-elle de la matière avec son milieu ?", "Sa membrane plasmique perméable."],
    ["Équation de la respiration cellulaire", chem("C6H12O6 + 6 O2 → 6 H2O + 6 CO2") + "<br>(+ molécules énergétiques)"],
    ["Équation de la photosynthèse", chem("6 CO2 + 6 H2O → C6H12O6 + 6 O2") + "<br>(grâce à la lumière)"],
    ["Équation de la fermentation alcoolique", chem("C6H12O6 → 2 CO2 + éthanol") + "<br>(+ molécules énergétiques)"],
    ["Où se déroule la respiration cellulaire ?", "Dans les mitochondries (organites)."],
    ["Où se déroule la photosynthèse ?", "Dans les chloroplastes."],
    ["Où se déroule la fermentation ?", "Dans le cytoplasme."],
    ["Conditions de la respiration", "Présence de glucose et de dioxygène dans le milieu (+ mitochondries)."],
    ["Conditions de la photosynthèse", "Présence de lumière, d'eau et de dioxyde de carbone (+ chloroplastes)."],
    ["Conditions de la fermentation", "Présence de glucose (pas besoin de dioxygène)."],
    ["Substrats de la respiration", "Glucose + dioxygène."],
    ["Produits de la photosynthèse", "Glucose + dioxygène."],
    ["Produits de la fermentation alcoolique", "CO₂ + éthanol + molécules énergétiques."],
    ["Molécule organique : exemple", "Le glucose C₆H₁₂O₆ (aussi : éthanol, amidon, protéines, lipides)."],
    ["Molécules minérales : exemples", "CO₂, H₂O, O₂, sels minéraux."],
    ["Métabolisme hétérotrophe", "Transformer des molécules organiques prélevées dans le milieu pour produire d'autres molécules organiques et des molécules énergétiques."],
    ["Métabolisme autotrophe", "Fabriquer sa matière organique à partir de matière minérale et de l'énergie lumineuse (photosynthèse)."],
    ["Quelles cellules ont un métabolisme hétérotrophe ?", "Cellules animales, cellules végétales non chlorophylliennes, cellules de champignons (levures) : pas de chloroplastes."],
    ["Une cellule de feuille possède…", "…des chloroplastes ET des mitochondries : photosynthèse + respiration."],
    ["Respiration ou fermentation : comment choisir ?", "Respiration si O₂ + mitochondries ; fermentation si absence de O₂ (ou de mitochondries)."],
    ["Enzyme (définition)", "Macromolécule qui accélère une réaction chimique en transformant un substrat en produit(s). Spécifique de son substrat, un seul type de réaction, intacte à la fin."],
    ["Substrat / produit", "Substrat : molécule transformée par l'enzyme. Produit : molécule obtenue."],
    ["Rho⁺ / Rho⁻", "Rho⁺ : mitochondries fonctionnelles, fait la respiration. Rho⁻ : ne peut pas, fait seulement la fermentation."],
    ["Immunodiffusion : que met-on dans le puits central ?", "Le filtrat de cellules (contenu cellulaire)."],
    ["Immunodiffusion : que signifie un arc de précipitation ?", "L'enzyme reconnue par l'anticorps de ce puits est présente dans le filtrat cellulaire."],
    ["Rôle du puits d'eau dans l'immunodiffusion", "Témoin négatif : sans anticorps, aucun arc ne doit se former."],
    ["Résultat de l'immunodiffusion des levures", "Arcs avec anti-F et anti-R : enzymes de fermentation et de respiration présentes, pas P."],
    ["Bilan du chapitre", "Les voies métaboliques diffèrent selon les organites et les enzymes spécifiques des cellules, ce qui explique leurs fonctions spécialisées."],
    ["Molécules intermédiaires", "Molécules qui relient (interconnectent) les voies métaboliques entre elles dans une cellule ou un organisme."],
  ].map(([f, b], i) => ({ id: "svt-a3-c" + i, f, b }));

  /* =========================================================
     GÉNÉRATEURS DE QUESTIONS (lvl 0 à 5 : la difficulté monte)
     ========================================================= */
  const DEFS = [
    ["Succession de réactions biochimiques qui transforment une molécule en une autre.", ["voie métabolique", "voies métaboliques"], "une voie métabolique"],
    ["Ensemble des voies métaboliques d'une cellule.", ["métabolisme", "métabolisme cellulaire", "métabolisme de la cellule"], "le métabolisme"],
    ["Structure à travers laquelle la cellule échange de la matière avec son milieu.", ["membrane plasmique", "membrane"], "la membrane plasmique"],
    ["Macromolécule qui accélère une réaction chimique et qui est spécifique de son substrat.", ["enzyme", "enzymes"], "une enzyme"],
    ["Molécule transformée par une enzyme (consommée par la réaction).", ["substrat", "substrats"], "le substrat"],
    ["Molécule fabriquée à la fin d'une réaction.", ["produit", "produits"], "le produit"],
    ["Organite où se déroule la respiration cellulaire.", ["mitochondrie", "mitochondries"], "la mitochondrie"],
    ["Organite où se déroule la photosynthèse.", ["chloroplaste", "chloroplastes"], "le chloroplaste"],
    ["Partie de la cellule où se déroule la fermentation.", ["cytoplasme"], "le cytoplasme"],
    ["Métabolisme d'une cellule qui utilise des molécules organiques prélevées dans le milieu.", ["hétérotrophe", "heterotrophe", "métabolisme hétérotrophe"], "hétérotrophe"],
    ["Métabolisme d'une cellule qui fabrique sa matière organique à partir de matière minérale et de lumière.", ["autotrophe", "métabolisme autotrophe"], "autotrophe"],
    ["Molécules qui relient les voies métaboliques entre elles.", ["molécules intermédiaires", "molécule intermédiaire", "intermédiaires"], "les molécules intermédiaires"],
  ];
  function gen_vocab(lvl) {
    const [d, ans, shown] = pick(DEFS);
    if (lvl < 2) {
      const others = sample(DEFS.filter(x => x[2] !== shown), 3).map(x => x[2]);
      return qcm(`Quel mot correspond à cette définition ?<blockquote>${d}</blockquote>`, shown, others, `<b>${shown}</b> : ${d}`);
    }
    return text(`Écris le mot qui correspond à cette définition.<blockquote>${d}</blockquote>`, ans, `<b>${shown}</b> : ${d}`, { hint: "un ou deux mots" });
  }

  function gen_equations(lvl) {
    const k = pick(VKEYS), v = VOIES[k];
    const t = lvl < 2 ? pick([0, 1]) : pick([1, 2, 3, 4]);
    if (t === 0) return qcm(`À quelle voie métabolique correspond cette équation ?<div class="eq">${chem(v.eq)}</div>`, v.Name, VKEYS.filter(x => x !== k).map(x => VOIES[x].Name).concat(["Digestion"]), `${chem(v.eq)} : c'est la <b>${v.name}</b>.`);
    if (t === 1) {
      const bads = { resp: ["C6H12O6 → 2 CO2 + éthanol", "6 CO2 + 6 H2O → C6H12O6 + 6 O2", "C6H12O6 + 6 CO2 → 6 H2O + 6 O2"], photo: ["C6H12O6 + 6 O2 → 6 H2O + 6 CO2", "6 O2 + 6 H2O → C6H12O6 + 6 CO2", "C6H12O6 → 2 CO2 + éthanol"], ferm: ["C6H12O6 + 6 O2 → 6 H2O + 6 CO2", "C6H12O6 + O2 → 2 CO2 + éthanol", "éthanol → C6H12O6 + 2 CO2"] }[k];
      return qcm(`Quelle est l'équation de la <b>${v.name}</b> ?`, chem(v.eq), bads.map(chem), `${v.Name} : <b>${chem(v.eq)}</b>`);
    }
    if (t === 2) {
      const blanks = { resp: ["C6H12O6 + 6 ___ → 6 H2O + 6 CO2", "O2"], photo: ["6 CO2 + 6 H2O → C6H12O6 + 6 ___", "O2"], ferm: ["C6H12O6 → 2 ___ + éthanol", "CO2"] }[k];
      const blanks2 = { resp: ["C6H12O6 + 6 O2 → 6 H2O + 6 ___", "CO2"], photo: ["6 ___ + 6 H2O → C6H12O6 + 6 O2", "CO2"], ferm: ["___ → 2 CO2 + éthanol", "C6H12O6"] }[k];
      const [e, a] = pick([blanks, blanks2]);
      return qcm(`Complète l'équation de la ${v.name} :<div class="eq">${chem(e)}</div>`, chem(a), ["O2", "CO2", "H2O", "C6H12O6", "éthanol"].filter(x => x !== a).slice(0, 3).map(chem), `${v.Name} : <b>${chem(v.eq)}</b>`);
    }
    if (t === 3) {
      const all = ["glucose", "dioxygène", "eau", "dioxyde de carbone", "éthanol"];
      const subs = { resp: ["glucose", "dioxygène"], photo: ["dioxyde de carbone", "eau"], ferm: ["glucose"] }[k];
      const prods = { resp: ["eau", "dioxyde de carbone"], photo: ["glucose", "dioxygène"], ferm: ["dioxyde de carbone", "éthanol"] }[k];
      const askSubs = Math.random() < 0.5, goods = askSubs ? subs : prods;
      return multi(`Coche toutes les molécules <b>${askSubs ? "consommées (substrats)" : "produites"}</b> par la ${v.name}.`, goods, all.filter(x => !goods.includes(x)), `${v.Name} : ${chem(v.eq)}.<br>Consommées : ${subs.join(" + ")}. Produites : ${prods.join(" + ")}${k !== "photo" ? " + molécules énergétiques" : ""}.`);
    }
    // t === 4 : nombre
    if (k === "ferm") return num(`Fermentation alcoolique : combien de molécules de CO₂ sont produites à partir d'<b>une</b> molécule de glucose ?`, 2, "", `${chem(v.eq)} : <b>2</b> CO₂ par glucose.`);
    const mol = pick(k === "resp" ? [["O₂ consommées", 6], ["CO₂ produites", 6], ["H₂O produites", 6]] : [["CO₂ consommées", 6], ["O₂ produites", 6], ["H₂O consommées", 6]]);
    return num(`${v.Name} : pour <b>une</b> molécule de glucose, combien de molécules de ${mol[0]} ?`, mol[1], "", `${chem(v.eq)} : le coefficient est <b>6</b>.`);
  }

  function gen_tableau(lvl) {
    const k = pick(VKEYS), v = VOIES[k];
    if (lvl >= 3 && Math.random() < 0.5) {
      const attr = pick(["loc", "cond"]);
      return match(`Associe chaque voie métabolique à ${attr === "loc" ? "sa <b>localisation</b> dans la cellule" : "ses <b>conditions indispensables</b>"}.`, VKEYS.map(x => [VOIES[x].Name, VOIES[x][attr]]), `Respiration : ${VOIES.resp[attr]}. Photosynthèse : ${VOIES.photo[attr]}. Fermentation : ${VOIES.ferm[attr]}.`);
    }
    const attr = pick(["loc", "cond", "subs", "prods"]);
    const lab = { loc: "Où se déroule", cond: "Quelles sont les conditions indispensables à", subs: "Quelles sont les molécules consommées par", prods: "Quelles sont les molécules produites par" }[attr];
    const extra = { loc: ["dans le noyau", "dans la membrane plasmique"], cond: ["présence de lumière seulement", "absence de glucose"], subs: ["éthanol + dioxygène"], prods: ["glucose + éthanol"] }[attr];
    const what = { loc: "localisation", cond: "conditions", subs: "molécules consommées", prods: "molécules produites" }[attr];
    return qcm(`${lab} la <b>${v.name}</b> ?`, chem(v[attr]), VKEYS.filter(x => x !== k).map(x => chem(VOIES[x][attr])).concat([pick(extra)]), `${v.Name}, ${what} : <b>${chem(v[attr])}</b>.<br><span class="eqs">${chem(v.eq)}</span>`, { fig: lvl < 2 ? cellDiag(k) : undefined });
  }

  function gen_organites(lvl) {
    const t = pick(lvl < 2 ? [0, 1, 2] : [0, 1, 2, 3, 4]);
    if (t === 0) { const m = Math.random() < 0.5; return qcm("Quel organite est représenté ?", m ? "Une mitochondrie" : "Un chloroplaste", [m ? "Un chloroplaste" : "Une mitochondrie", "Un noyau", "Une vacuole"], m ? "Membrane interne <b>repliée</b> : c'est une <b>mitochondrie</b>, siège de la respiration." : "Empilements de membranes (vert) : c'est un <b>chloroplaste</b>, siège de la photosynthèse.", { fig: m ? mitoSvg() : chloroSvg() }); }
    if (t === 1) { const m = Math.random() < 0.5; return qcm(`Quelle voie métabolique se déroule dans ${m ? "la mitochondrie" : "le chloroplaste"} ?`, m ? "La respiration cellulaire" : "La photosynthèse", [m ? "La photosynthèse" : "La respiration cellulaire", "La fermentation alcoolique", "La digestion"], m ? "Mitochondrie ➜ <b>respiration cellulaire</b>." : "Chloroplaste ➜ <b>photosynthèse</b>."); }
    if (t === 2) return pick([
      vf("Une cellule de feuille possède des mitochondries.", true, "Oui : les cellules chlorophylliennes ont des chloroplastes <b>et</b> des mitochondries. Elles font donc aussi la respiration."),
      vf("Une cellule musculaire possède des chloroplastes.", false, "Les cellules animales n'ont <b>jamais</b> de chloroplastes : elles sont hétérotrophes."),
      vf("La fermentation alcoolique se déroule dans les mitochondries.", false, "La fermentation se déroule dans le <b>cytoplasme</b>. C'est la respiration qui a lieu dans les mitochondries."),
      vf("Une levure possède des chloroplastes.", false, "La levure est un champignon : <b>pas de chloroplastes</b>, métabolisme hétérotrophe."),
      vf("Une cellule de racine de carotte possède des chloroplastes.", false, "Les racines ne sont pas chlorophylliennes : pas de chloroplastes, donc pas de photosynthèse."),
      vf("La chlorelle (algue verte) possède des chloroplastes et des mitochondries.", true, "La chlorelle est chlorophyllienne : chloroplastes (photosynthèse) et mitochondries (respiration)."),
    ]);
    if (t === 3) return multi("Coche les cellules qui possèdent des <b>chloroplastes</b>.", ["cellule de feuille", "chlorelle (algue verte)"], ["cellule musculaire", "levure", "cellule de racine", "cellule de pétale blanc"], "Seules les cellules <b>chlorophylliennes</b> (feuille, algues vertes) ont des chloroplastes.");
    return qcm("Pourquoi une cellule de racine ne peut-elle pas réaliser la photosynthèse ?", "Elle ne possède pas de chloroplastes", ["Elle ne possède pas de mitochondries", "Elle n'a pas de membrane plasmique", "Elle ne reçoit pas de glucose"], "La photosynthèse nécessite des <b>chloroplastes</b> (et leurs enzymes). La racine n'en a pas ; en plus, elle n'est pas à la lumière.");
  }

  const ORGA = ["glucose", "éthanol", "amidon", "protéines", "lipides", "saccharose (sucre)"];
  const MINE = ["dioxyde de carbone (CO₂)", "eau (H₂O)", "dioxygène (O₂)", "sels minéraux", "ions nitrate"];
  function gen_molecules(lvl) {
    if (lvl < 2) {
      const org = Math.random() < 0.5, m = pick(org ? ORGA : MINE);
      return qcm(`${m.charAt(0).toUpperCase() + m.slice(1)} : molécule organique ou minérale ?`, org ? "Organique" : "Minérale", [org ? "Minérale" : "Organique"], org ? `${m} : molécule <b>organique</b>, fabriquée par les êtres vivants.` : `${m} : molécule <b>minérale</b>.${/CO/.test(m) ? " Attention : il contient du carbone, mais c'est une molécule minérale !" : ""}`);
    }
    const go = sample(ORGA, rnd(2, 3)), bad = sample(MINE, rnd(2, 3));
    return multi("Coche toutes les molécules <b>organiques</b>.", go, bad, `Organiques : ${go.join(", ")}. Minérales : ${bad.join(", ")}.`, { trap: "Le CO₂ contient du carbone mais il est minéral." });
  }

  const CELLS = [
    { n: "une cellule de feuille d'épinard", auto: true, v: ["photo", "resp"], why: "chlorophyllienne : chloroplastes + mitochondries" },
    { n: "une chlorelle (algue verte unicellulaire)", auto: true, v: ["photo", "resp"], why: "chlorophyllienne : chloroplastes + mitochondries" },
    { n: "une cellule de racine de carotte", auto: false, v: ["resp"], why: "végétale non chlorophyllienne : mitochondries mais pas de chloroplastes" },
    { n: "une cellule de pétale blanc", auto: false, v: ["resp"], why: "végétale non chlorophyllienne : pas de chloroplastes" },
    { n: "une cellule musculaire", auto: false, v: ["resp"], why: "animale : mitochondries, pas de chloroplastes" },
    { n: "une cellule du foie", auto: false, v: ["resp"], why: "animale : mitochondries, pas de chloroplastes" },
    { n: "une levure (champignon unicellulaire)", auto: false, v: ["resp", "ferm"], why: "champignon : respiration avec O₂, fermentation sans O₂" },
    { n: "une levure Rho⁻ (mitochondries non fonctionnelles)", auto: false, v: ["ferm"], why: "sans mitochondries fonctionnelles, elle ne peut faire que la fermentation" },
  ];
  function gen_cells(lvl) {
    const c = pick(CELLS);
    if (lvl < 2 || Math.random() < 0.35) return qcm(`Le métabolisme d'${c.n} est :`, c.auto ? "autotrophe" : "hétérotrophe", [c.auto ? "hétérotrophe" : "autotrophe"], `${c.n.charAt(0).toUpperCase() + c.n.slice(1)} : ${c.why}. Métabolisme <b>${c.auto ? "autotrophe" : "hétérotrophe"}</b>.`);
    const names = { resp: "respiration cellulaire", photo: "photosynthèse", ferm: "fermentation alcoolique" };
    return multi(`Quelle(s) voie(s) métabolique(s) peut réaliser ${c.n} ?`, c.v.map(x => names[x]), VKEYS.filter(x => !c.v.includes(x)).map(x => names[x]), `${c.n.charAt(0).toUpperCase() + c.n.slice(1)} : ${c.why}. Voie(s) : <b>${c.v.map(x => names[x]).join(" + ")}</b>.`, c.auto ? { trap: "Une cellule chlorophyllienne fait aussi la respiration !" } : {});
  }

  const SCEN = [
    { txt: "Des levures sont placées dans un bioréacteur avec du glucose et du dioxygène.", g: { o2: "down", co2: "up" }, v: "resp" },
    { txt: "Des chlorelles (algues vertes) sont placées dans un bioréacteur <b>éclairé</b>.", g: { o2: "up", co2: "down" }, v: "photo" },
    { txt: "Des chlorelles sont placées dans un bioréacteur <b>à l'obscurité</b>.", g: { o2: "down", co2: "up" }, v: "resp" },
    { txt: "Des levures sont placées dans un bioréacteur avec du glucose, <b>sans dioxygène</b>.", g: { o2: "zero", co2: "up", eth: "up" }, v: "ferm" },
    { txt: "Une souche de levures est placée avec du glucose et du dioxygène.", g: { o2: "flat", co2: "up", eth: "up" }, v: "ferm" },
    { txt: "Des cellules de racine sont placées dans un bioréacteur avec du glucose et du dioxygène.", g: { o2: "down", co2: "up" }, v: "resp" },
  ];
  function gen_identify(lvl) {
    if (lvl < 2 && Math.random() < 0.6) {
      const k = pick(VKEYS);
      return qcm("Ce schéma montre les échanges d'une cellule avec son milieu. Quelle voie métabolique réalise-t-elle ?", VOIES[k].Name, VKEYS.filter(x => x !== k).map(x => VOIES[x].Name), `Consomme ${VOIES[k].ins.join(" ")}, rejette ${VOIES[k].outs.join(" ")} ➜ <b>${VOIES[k].name}</b>.`, { fig: cellDiag(k, { hideInside: true }) });
    }
    const s = pick(SCEN), v = VOIES[s.v];
    const desc = [s.g.o2 && ({ up: "O₂ augmente", down: "O₂ diminue", flat: "O₂ reste constant", zero: "pas de O₂" })[s.g.o2], s.g.co2 && ({ up: "CO₂ augmente", down: "CO₂ diminue" })[s.g.co2], s.g.eth && "éthanol augmente"].filter(Boolean).join(", ");
    const kn = { resp: "la respiration consomme du O₂ et rejette du CO₂", photo: "la photosynthèse consomme du CO₂ et rejette du O₂, à la lumière", ferm: "la fermentation produit du CO₂ et de l'éthanol sans consommer de O₂" }[s.v];
    return qcm(`${s.txt} On mesure les concentrations dans le milieu. Quelle voie métabolique est réalisée ?`, v.Name, VKEYS.filter(x => x !== s.v).map(x => VOIES[x].Name), `<i>J'observe que</i> ${desc}. <i>Je sais que</i> ${kn}. <i>J'en déduis que</i> les cellules réalisent la <b>${v.name}</b>.`, { fig: bioGraph(s.g), trap: s.v === "resp" && /chlorelle/.test(s.txt) ? "À l'obscurité, une cellule chlorophyllienne ne fait plus la photosynthèse mais respire toujours." : s.v === "ferm" && s.g.o2 === "flat" ? "O₂ présent mais pas consommé : la souche ne peut pas respirer (Rho⁻)." : undefined });
  }

  const ENZ_VF = [
    ["Une enzyme est détruite à la fin de la réaction.", false, "Elle reste <b>intacte</b> : elle peut resservir."],
    ["Une enzyme est spécifique de son substrat.", true, "Chaque enzyme ne reconnaît <b>qu'un</b> substrat."],
    ["Une même enzyme peut catalyser plusieurs types de réactions différentes.", false, "Une enzyme ne permet <b>qu'un seul type</b> de réaction chimique."],
    ["Une enzyme accélère une réaction chimique.", true, "C'est son rôle : accélérer la transformation du substrat en produit."],
    ["Une enzyme est une macromolécule.", true, "Oui, c'est une grosse molécule (une protéine)."],
    ["Dans une voie métabolique, le produit d'une réaction peut devenir le substrat de la réaction suivante.", true, "Exemple : Produit B = Substrat B de l'enzyme 2."],
    ["Le substrat est la molécule fabriquée par l'enzyme.", false, "Le substrat est la molécule <b>transformée</b> ; la molécule fabriquée est le <b>produit</b>."],
    ["Chaque voie métabolique nécessite des enzymes spécifiques.", true, "Exemple : enzymes P pour la photosynthèse, R pour la respiration, F pour la fermentation."],
  ];
  function gen_enzymes(lvl) {
    const t = pick(lvl < 2 ? [0, 0, 1] : [0, 1, 2, 3]);
    if (t === 0) { const [p, tr, e] = pick(ENZ_VF); return vf(p, tr, e); }
    if (t === 1) return qcm("Sur ce schéma, que devient l'enzyme à la fin de la réaction ?", "Elle reste intacte et peut être réutilisée", ["Elle est transformée en produit", "Elle est détruite", "Elle devient le substrat"], "L'enzyme reste <b>intacte</b>. Seul le substrat est transformé en produit.", { fig: enzymeSvg() });
    if (t === 2) return order("Remets dans l'ordre les étapes d'une voie métabolique à 2 enzymes.", ["Substrat A", "Enzyme 1 transforme A", "Produit B = substrat B", "Enzyme 2 transforme B", "Produit C"], "Le produit de la première réaction devient le substrat de la suivante : A → B → C.");
    return qcm("Une cellule ne possède pas l'enzyme P (photosynthèse). Que peut-on en déduire ?", "Elle ne peut pas réaliser la photosynthèse", ["Elle ne peut pas respirer", "Elle fabrique l'enzyme P à partir de glucose", "Elle fait la photosynthèse plus lentement"], "Les enzymes sont <b>spécifiques</b> : sans enzyme P, pas de photosynthèse.");
  }

  function gen_tp7(lvl) {
    const t = pick(lvl < 2 ? [0, 1, 2] : [1, 2, 3, 4]);
    if (t === 0) return qcm("Pourquoi la souche Rho⁻ ne peut-elle pas réaliser la respiration cellulaire ?", "Ses mitochondries ne sont pas fonctionnelles", ["Elle n'a pas de chloroplastes", "Elle ne consomme pas de glucose", "Elle n'a pas de membrane plasmique"], "La respiration se fait dans les <b>mitochondries</b>. Rho⁻ a des mitochondries non fonctionnelles : elle ne peut faire que la fermentation.");
    if (t === 1) return vf(pick(["La souche Rho⁺ peut réaliser la respiration cellulaire.", "La souche Rho⁻ peut réaliser la fermentation alcoolique."]), true, "Rho⁺ : respiration (et fermentation sans O₂). Rho⁻ : fermentation uniquement.");
    if (t === 2) return order("Remets dans l'ordre la stratégie de résolution du TP7.", ["Ce que je cherche : identifier chaque souche", "Ce que je sais : Rho⁺ peut respirer, Rho⁻ non", "Ce que je fais : je leur donne glucose + O₂", "Attendus : une seule souche respire (Rho⁺)"], "Les 4 cases de la stratégie : cherche ➜ sais ➜ fais ➜ attendus.");
    if (t === 3) {
      const aIsPlus = Math.random() < 0.5;
      const A = aIsPlus ? { o2: "down", co2: "up" } : { o2: "flat", co2: "up", eth: "up" };
      return qcm(`On fournit du glucose et du O₂ à la souche <b>A</b>. Voici les mesures. La souche A est-elle Rho⁺ ou Rho⁻ ?`, aIsPlus ? "Rho⁺" : "Rho⁻", [aIsPlus ? "Rho⁻" : "Rho⁺"], aIsPlus ? "O₂ consommé et CO₂ rejeté : elle <b>respire</b>, donc ses mitochondries fonctionnent ➜ <b>Rho⁺</b>." : "O₂ <b>non consommé</b> malgré sa présence, éthanol produit : elle ne fait que la <b>fermentation</b> ➜ <b>Rho⁻</b>.", { fig: bioGraph(A) });
    }
    return qcm("Pour distinguer Rho⁺ et Rho⁻, quelle mesure est la plus décisive ?", "La consommation de dioxygène", ["La production de CO₂", "La consommation de glucose", "La couleur des levures"], "Les deux souches consomment du glucose et rejettent du CO₂ (respiration <b>ou</b> fermentation). Seule la respiration <b>consomme du O₂</b>.", { trap: "Le CO₂ ne permet pas de trancher : il est produit par les deux voies." });
  }

  const ORGS = [
    { n: "levures", c: "L", e: ["F", "R"] },
    { n: "chlorelles", c: "C", e: ["P", "R"] },
    { n: "cellules de feuille", c: "F", e: ["P", "R"] },
    { n: "cellules de racine", c: "R", e: ["R"] },
  ];
  const ENZ_NAME = { P: "photosynthèse", R: "respiration", F: "fermentation" };
  function gen_tp8(lvl) {
    const t = pick(lvl < 2 ? [0, 1, 2, 3] : [3, 4, 4, 5, 6]);
    if (t === 0) return qcm("Dans un test d'immunodiffusion, que place-t-on dans le <b>puits central</b> ?", "Le filtrat de cellules (chlorelles ou levures)", ["De l'eau", "Les anticorps anti-enzymes", "Les 3 enzymes P, R et F purifiées"], "Puits central : <b>filtrat cellulaire</b>. Puits périphériques : <b>anticorps</b> (et de l'eau comme témoin).");
    if (t === 1) return qcm("À quoi sert le puits contenant de l'<b>eau</b> ?", "C'est un témoin négatif", ["À diluer le filtrat", "À faire apparaître les arcs", "À nourrir les cellules"], "L'eau est un <b>témoin négatif</b> : aucun arc ne doit s'y former. Ça prouve que les arcs sont dus aux anticorps.");
    if (t === 2) return qcm("Un arc de précipitation se forme entre le puits central et le puits anti-R. Cela signifie que :", "L'enzyme R est présente dans le filtrat cellulaire", ["L'anticorps anti-R est présent dans le filtrat", "Les cellules ne font pas la respiration", "L'enzyme R est absente"], "L'anticorps anti-R se fixe sur l'enzyme R : l'arc prouve que l'<b>enzyme R est présente</b> dans les cellules.", { trap: "L'arc révèle l'enzyme, pas l'anticorps." });
    const o = lvl >= 4 && Math.random() < 0.4 ? { n: "cellules inconnues X", c: "X", e: sample(["P", "R", "F"], rnd(1, 2)).sort() } : pick(ORGS);
    const fig = gelSvg(o.e, o.c), leg = GEL_LEGEND(o.c + " (" + o.n + ")");
    if (t === 3) return multi(`Voici le résultat du test d'immunodiffusion avec des ${o.n}. Quelles enzymes sont présentes ?${leg}`, o.e.map(x => "enzyme " + x), ["P", "R", "F"].filter(x => !o.e.includes(x)).map(x => "enzyme " + x), `Arcs avec ${o.e.map(x => "anti-" + x).join(" et ")} ➜ enzyme(s) <b>${o.e.join(" et ")}</b> présente(s). Pas d'arc avec T (témoin), normal.`, { fig });
    if (t === 4) return multi(`Résultat du test avec des ${o.n}. Quelle(s) voie(s) métabolique(s) ces cellules peuvent-elles réaliser ?${leg}`, o.e.map(x => ENZ_NAME[x]), ["P", "R", "F"].filter(x => !o.e.includes(x)).map(x => ENZ_NAME[x]), `Enzymes présentes : ${o.e.join(", ")}. Les enzymes sont spécifiques ➜ <b>${o.e.map(x => ENZ_NAME[x]).join(" + ")}</b>.`, { fig });
    if (t === 5) { const real = pick(ORGS.slice(0, 2)); return qcm(`Voici un gel obtenu avec des cellules inconnues (puits central ?). S'agit-il de levures ou de chlorelles ?${GEL_LEGEND("?")}`, real.n === "levures" ? "Des levures" : "Des chlorelles", [real.n === "levures" ? "Des chlorelles" : "Des levures"], real.n === "levures" ? "Arcs F et R, pas P : pas de photosynthèse mais fermentation ➜ <b>levures</b>." : "Arcs P et R : photosynthèse + respiration ➜ <b>chlorelles</b> (chlorophylliennes).", { fig: gelSvg(real.e, "?") }); }
    return qcm("Pourquoi compare-t-on les résultats obtenus avec les chlorelles et avec les levures ?", "Pour montrer qu'elles possèdent des enzymes différentes", ["Pour vérifier que l'eau ne fait pas d'arc", "Pour mesurer la quantité de glucose", "Pour montrer qu'elles ont les mêmes enzymes"], "Les arcs ne se forment pas aux mêmes puits : chlorelles et levures ont des <b>enzymes différentes</b>, donc des voies métaboliques différentes.");
  }

  const REDAC = [
    { p: "Explique pourquoi une cellule de feuille peut réaliser la photosynthèse <b>et</b> la respiration, alors qu'une cellule de racine ne réalise que la respiration.", pts: ["La cellule de feuille possède des chloroplastes (photosynthèse)", "Elle possède aussi des mitochondries (respiration)", "La cellule de racine n'a pas de chloroplastes, seulement des mitochondries", "Les voies dépendent des organites et des enzymes spécifiques"], m: "La cellule de feuille est chlorophyllienne : elle possède des <b>chloroplastes</b>, où se déroule la photosynthèse, et des <b>mitochondries</b>, où se déroule la respiration. La cellule de racine n'est pas chlorophyllienne : elle n'a <b>pas de chloroplastes</b>, seulement des mitochondries, donc elle ne peut faire que la respiration. Les voies métaboliques dépendent des <b>organites</b> et des <b>enzymes spécifiques</b> de chaque cellule." },
    { p: "Des levures sont placées dans un milieu avec du glucose mais <b>sans dioxygène</b>. On mesure une augmentation du CO₂ et l'apparition d'éthanol. Quelle voie métabolique réalisent-elles ? Rédige ta réponse.", pts: ["J'observe : CO₂ augmente, éthanol apparaît, sans O₂", "Je sais : la fermentation consomme du glucose et produit CO₂ + éthanol sans O₂", "J'en déduis : les levures réalisent la fermentation alcoolique", "Elle se déroule dans le cytoplasme"], m: "<i>J'observe que</i> le CO₂ augmente et que de l'éthanol apparaît, en l'absence de dioxygène. <i>Je sais que</i> la fermentation alcoolique consomme du glucose et produit du CO₂ et de l'éthanol (C₆H₁₂O₆ → 2 CO₂ + éthanol), sans besoin de O₂. <i>J'en déduis que</i> les levures réalisent la <b>fermentation alcoolique</b>, dans leur cytoplasme." },
    { p: "Définis « voie métabolique » et « métabolisme », puis explique comment la cellule obtient la matière nécessaire.", pts: ["Voie métabolique : succession de réactions biochimiques qui transforment une molécule en une autre", "Métabolisme : ensemble des voies métaboliques de la cellule", "Échanges de matière (minérale ou organique) avec le milieu", "À travers la membrane plasmique perméable"], m: "Une <b>voie métabolique</b> est une succession de réactions biochimiques qui transforment une molécule en une autre. Le <b>métabolisme</b> est l'ensemble de ces voies ; il est indispensable à la survie de la cellule. Pour cela, la cellule réalise des <b>échanges de matière</b> minérale ou organique avec son milieu, à travers sa <b>membrane plasmique perméable</b>." },
    { p: "Interprète le résultat du test d'immunodiffusion réalisé avec un filtrat de levures (arcs avec les anti-enzymes F et R).", pts: ["J'observe deux arcs, avec anti-F et anti-R (pas avec P ni avec T)", "Je sais qu'un arc signifie que l'enzyme est présente dans le filtrat", "Les enzymes F et R sont présentes, pas P", "Les enzymes étant spécifiques, la levure peut faire fermentation et respiration (pas photosynthèse)"], m: "<i>J'observe</i> deux arcs de précipitation, entre le filtrat de levures et les anticorps anti-F et anti-R, aucun avec anti-P ni avec le témoin (eau). <i>Je sais qu'</i>un arc signifie que l'enzyme reconnue par l'anticorps est présente dans le filtrat. <i>J'en déduis que</i> les levures possèdent les enzymes <b>F et R</b> mais pas P. Les enzymes étant spécifiques des voies métaboliques, les levures peuvent réaliser la <b>fermentation</b> et la <b>respiration</b>, mais pas la photosynthèse." },
    { p: "Explique pourquoi la souche de levure Rho⁻ ne peut réaliser que la fermentation, même en présence de dioxygène.", pts: ["Rho⁻ a des mitochondries non fonctionnelles", "La respiration se déroule dans les mitochondries", "Donc pas de respiration, O₂ non consommé", "La fermentation se fait dans le cytoplasme : elle reste possible"], m: "La souche Rho⁻ possède des <b>mitochondries non fonctionnelles</b>. Or la respiration cellulaire se déroule dans les mitochondries : Rho⁻ ne peut donc pas respirer, même avec du O₂ (le O₂ n'est pas consommé). La fermentation, elle, se déroule dans le <b>cytoplasme</b> et ne nécessite que du glucose : c'est la seule voie possible pour Rho⁻." },
    { p: "Compare la respiration cellulaire et la photosynthèse (molécules consommées et produites, conditions, localisation).", pts: ["Respiration : glucose + O₂ → H₂O + CO₂ + molécules énergétiques", "Photosynthèse : CO₂ + H₂O → glucose + O₂", "Respiration : mitochondries, besoin de glucose et O₂", "Photosynthèse : chloroplastes, besoin de lumière, eau et CO₂"], m: "Les deux voies ont des équations <b>inverses</b>. La <b>respiration</b> consomme glucose et O₂ et produit H₂O, CO₂ et des molécules énergétiques ; elle se déroule dans les <b>mitochondries</b> et nécessite glucose et O₂. La <b>photosynthèse</b> consomme CO₂ et H₂O et produit glucose et O₂ ; elle se déroule dans les <b>chloroplastes</b> et nécessite lumière, eau et CO₂." },
    { p: "Pourquoi les cellules d'un organisme peuvent-elles avoir des fonctions spécialisées ? (bilan du chapitre)", pts: ["Les voies métaboliques diffèrent d'une cellule à l'autre", "Selon les organites qu'elles possèdent (mitochondries, chloroplastes)", "Selon les enzymes spécifiques qu'elles possèdent", "Les voies sont reliées par des molécules intermédiaires (flux de matière et d'énergie)"], m: "Les voies métaboliques peuvent être différentes selon les <b>organites</b> et les <b>enzymes spécifiques</b> que les cellules possèdent, ce qui explique leurs <b>fonctions spécialisées</b>. Au sein de la cellule ou de l'organisme, ces voies sont interconnectées par des <b>molécules intermédiaires</b> : il existe des flux permanents de matière et d'énergie." },
  ];
  function gen_redac() { const r = pick(REDAC); return redac(r.p, r.pts, r.m); }

  /* =========================================================
     ENREGISTREMENT
     ========================================================= */
  RV.addChapter({
    id: "svt-a3", subject: "svt", code: "A3",
    title: "Le métabolisme des cellules",
    long: "Le fonctionnement de l'organisme, résultat du métabolisme des différentes cellules spécialisées",
    examKey: "svt",
    lesson, methods, cards,
    skills: [
      { id: "svt.vocab", name: "Définitions du cours", short: "voie métabolique, enzyme, substrat…", lesson: "intro", gen: gen_vocab },
      { id: "svt.equations", name: "Les 3 équations", short: "respiration, photosynthèse, fermentation", lesson: "voies", gen: gen_equations },
      { id: "svt.tableau", name: "Le tableau des 3 voies", short: "substrats, produits, conditions, lieu", lesson: "voies", gen: gen_tableau },
      { id: "svt.organites", name: "Mitochondries et chloroplastes", short: "quel organite, quelle voie ?", lesson: "organites", gen: gen_organites },
      { id: "svt.molecules", name: "Organique ou minérale ?", short: "glucose, CO₂, O₂…", lesson: "intro", gen: gen_molecules },
      { id: "svt.cells", name: "Autotrophe ou hétérotrophe ?", short: "quelle cellule fait quelle voie", lesson: "hetero", gen: gen_cells },
      { id: "svt.identify", name: "Identifier une voie (mesures)", short: "lire un graphique O₂ / CO₂", lesson: "voies", gen: gen_identify },
      { id: "svt.enzymes", name: "Les enzymes", short: "spécifique, intacte, substrat → produit", lesson: "enzymes", gen: gen_enzymes },
      { id: "svt.tp7", name: "TP7 : levures Rho⁺ / Rho⁻", short: "respiration ou fermentation ?", lesson: "tp7", gen: gen_tp7 },
      { id: "svt.tp8", name: "TP8 : immunodiffusion", short: "lire un gel, en déduire les voies", lesson: "tp8", gen: gen_tp8 },
      { id: "svt.redac", name: "Questions de rédaction", short: "je sais que / j'en déduis", lesson: "bilan", gen: gen_redac, selfGraded: true },
    ],
    // contrôle blanc : 20 points
    exam: [
      ["svt.vocab", 2], ["svt.equations", 2], ["svt.tableau", 2], ["svt.organites", 1], ["svt.molecules", 1], ["svt.cells", 2],
      ["svt.identify", 2], ["svt.enzymes", 2], ["svt.tp7", 1], ["svt.tp8", 3], ["svt.redac", 2],
    ],
  });
  RV._svt = { cellDiag, gelSvg, VOIES };
})(typeof window !== "undefined" ? window : globalThis);
