/* ch-pc-c2.js — Physique-chimie, chapitre 2 : corps purs et mélanges au quotidien */
(function (root) {
  const RV = root.RV;
  const { pick, rnd, shuffle, sample, qcm, multi, vf, num, text, match, order, redac, svg, fmt } = RV;
  const chem = s => s.replace(/([A-Za-z)])(\d+)/g, "$1<sub>$2</sub>");

  /* =========================================================
     DONNÉES
     ========================================================= */
  // liquides : masse volumique (g/L, 20 °C), températures de fusion et d'ébullition (°C, 1013 hPa)
  const LIQ = [
    { n: "eau", rho: 1000, tf: 0, teb: 100 },
    { n: "éthanol", rho: 789, tf: -114, teb: 78 },
    { n: "acétone", rho: 784, tf: -95, teb: 56 },
    { n: "cyclohexane", rho: 779, tf: 6.5, teb: 81 },
    { n: "acide acétique", rho: 1049, tf: 17, teb: 118 },
    { n: "glycérol", rho: 1261, tf: 18, teb: 290 },
    { n: "dichlorométhane", rho: 1330, tf: -97, teb: 40 },
  ];
  const SOL = [
    { n: "aluminium", rho: 2700 }, { n: "fer", rho: 7870 }, { n: "cuivre", rho: 8960 }, { n: "plomb", rho: 11350 }, { n: "or", rho: 19300 }, { n: "zinc", rho: 7140 },
  ];
  // solides pour le banc Kofler
  const KOF = [
    { n: "vanilline", tf: 82 }, { n: "acide benzoïque", tf: 122 }, { n: "aspirine", tf: 135 }, { n: "glucose", tf: 146 },
    { n: "acide citrique", tf: 153 }, { n: "paracétamol", tf: 169 }, { n: "caféine", tf: 236 },
  ];
  const PURMEL = {
    pur: ["eau distillée", "fer", "cuivre", "sucre (saccharose) pur", "sel (chlorure de sodium) pur", "dioxygène", "éthanol pur", "aluminium", "diamant (carbone pur)"],
    homo: ["eau du robinet", "eau minérale", "air", "eau sucrée", "eau salée (non saturée)", "thé sucré", "vinaigre", "sirop de menthe dilué", "vin"],
    hetero: ["vinaigrette", "eau boueuse", "jus d'orange avec pulpe", "eau + huile", "eau salée saturée (avec dépôt de sel)", "sable + eau", "granite"],
  };
  const TESTS = [
    { sp: "Dioxygène (O₂)", t: "mol", det: "bûchette incandescente", res: "elle se rallume (combustion ravivée)" },
    { sp: "Dihydrogène (H₂)", t: "mol", det: "allumette enflammée", res: "petite détonation (« aboiement »)" },
    { sp: "Eau (H₂O)", t: "mol", det: "sulfate de cuivre anhydre (blanc)", res: "il devient bleu" },
    { sp: "Dioxyde de carbone (CO₂)", t: "mol", det: "eau de chaux", res: "elle se trouble (précipité blanc)" },
    { sp: "Ion chlorure (Cl⁻)", t: "ion", det: "nitrate d'argent", res: "précipité blanc qui noircit à la lumière" },
    { sp: "Ion calcium (Ca²⁺)", t: "ion", det: "oxalate d'ammonium", res: "précipité blanc" },
    { sp: "Ion sulfate (SO₄²⁻)", t: "ion", det: "chlorure de baryum", res: "précipité blanc" },
    { sp: "Ion cuivre II (Cu²⁺)", t: "ion", det: "hydroxyde de sodium (soude)", res: "précipité bleu" },
    { sp: "Ion fer II (Fe²⁺)", t: "ion", det: "hydroxyde de sodium (soude)", res: "précipité vert" },
    { sp: "Ion fer III (Fe³⁺)", t: "ion", det: "hydroxyde de sodium (soude)", res: "précipité orange (rouille)" },
    { sp: "Ion magnésium (Mg²⁺)", t: "ion", det: "hydroxyde de sodium (soude)", res: "précipité blanc" },
  ];

  /* =========================================================
     SCHÉMAS
     ========================================================= */
  function heatCurve(pure, teb, o = {}) {
    const t1 = o.t1 || rnd(5, 8), T0 = 20, pts = [];
    for (let t = 0; t <= 16; t += 0.5) {
      let T;
      if (t <= t1) T = T0 + (teb - T0) * Math.sin((t / t1) * Math.PI / 2);
      else T = pure ? teb : teb + (t - t1) * 0.9;
      pts.push([t, T]);
    }
    const ymax = Math.ceil((Math.max(...pts.map(p => p[1])) + 15) / 20) * 20;
    const step = ymax <= 140 ? 10 : 20, yt = []; for (let y = 0; y <= ymax; y += step) yt.push(y);
    return RV.plot({ xmax: 16, ymax, xlabel: "temps (min)", ylabel: "température (°C)", series: [{ pts, cls: "s1" }], yticks: yt, yLabelStep: 20, xticks: [0, 4, 8, 12, 16], label: "courbe d'évolution de la température" });
  }
  // plaque de CCM : dépôts [{lab, spots:[hauteur 0-1]}]
  function ccmSvg(deps) {
    const W = 300, H = 230, x0 = 50, base = 196, front = 30, w = (W - 2 * x0) / (deps.length - 1 || 1);
    let s = `<rect x="20" y="16" width="${W - 40}" height="${H - 24}" rx="4" class="plate"/>`;
    s += `<line x1="24" x2="${W - 24}" y1="${front}" y2="${front}" class="front"/><text x="${W - 26}" y="${front - 4}" class="t xs muted" text-anchor="end">front de l'éluant</text>`;
    s += `<line x1="24" x2="${W - 24}" y1="${base}" y2="${base}" class="base"/><text x="${W - 26}" y="${base - 5}" class="t xs muted" text-anchor="end">ligne de dépôt</text>`;
    deps.forEach((d, i) => {
      const x = x0 + i * w;
      s += `<text x="${x}" y="${H + 10}" class="t b" text-anchor="middle">${d.lab}</text><circle cx="${x}" cy="${base}" r="2.5" class="dep"/>`;
      d.spots.forEach(h => { s += `<ellipse cx="${x}" cy="${(base - h * (base - front)).toFixed(1)}" rx="8" ry="6" class="spot"/>`; });
    });
    return svg(W, H + 14, s, "chromatogramme");
  }
  function tubeSvg() {
    let s = RV.arrowDefs("at");
    s += `<path d="M40 20 L40 110 A14 14 0 0 0 68 110 L68 20" class="tube"/><rect x="41" y="72" width="26" height="40" class="liq"/><path d="M54 2 L54 30" class="arrow" marker-end="url(#at)"/><text x="62" y="12" class="t xs">réactif</text>`;
    s += `<path d="M95 70 L140 70" class="arrow" marker-end="url(#at)"/>`;
    s += `<path d="M170 20 L170 110 A14 14 0 0 0 198 110 L198 20" class="tube"/><rect x="171" y="72" width="26" height="40" class="liq"/><ellipse cx="184" cy="114" rx="11" ry="6" class="ppt"/><text x="206" y="116" class="t xs">précipité</text>`;
    return svg(260, 132, s, "test chimique : formation d'un précipité");
  }

  /* =========================================================
     LEÇON
     ========================================================= */
  const JEUDI = `<span class="tag hot">Contrôle de jeudi</span>`;
  const lesson = [
    {
      id: "purmel", title: "1. Corps purs et mélanges", badge: JEUDI, html: () => `
<div class="def">Un <b>corps pur</b> est une substance (solide, liquide ou gazeuse) ne comportant qu'<b>une seule espèce chimique</b>, sous forme atomique ou moléculaire.<br><span class="ex">Exemples : le fer (Fe), le sucre ou saccharose (C₁₂H₂₂O₁₁), l'eau distillée.</span></div>
<p class="trap">⚠️ Correction du cahier : la formule du saccharose est <b>C₁₂H₂₂O₁₁</b> (et pas C₆H₁₂O₁₁). C₆H₁₂O₆, c'est le glucose.</p>
<div class="def">Un <b>mélange</b> est une substance constituée de <b>plusieurs espèces chimiques</b>.<br>• <b>homogène</b> : on ne distingue qu'<b>une seule phase</b> à l'œil nu (eau sucrée, air) ;<br>• <b>hétérogène</b> : on distingue <b>plusieurs phases</b> (vinaigrette, eau boueuse).</div>
<div class="two"><div class="tile"><b>L'air</b> : mélange homogène de gaz<br>≈ <b>79 %</b> de diazote N₂<br>≈ <b>20 %</b> de dioxygène O₂<br>≈ <b>1 %</b> d'autres gaz (CO₂…)<br><span class="small muted">(pourcentages en volume)</span></div>
<div class="tile"><b>Masse volumique de l'air</b><br>ρ = <b>1,3 g·L⁻¹</b><br>à <b>1013 hPa</b> (hectopascals) et <b>20 °C</b><br><span class="small muted">(conditions normales de pression et de température)</span></div></div>
<p>Une <b>solution saturée</b> (le sel ne se dissout plus et se dépose au fond) est un <b>mélange hétérogène</b>.</p>
<h4>Pourcentage massique</h4>
<div class="formula">p(A) = 100 × <span class="frac"><span>m(A)</span><span>m</span></span></div>
<p>avec m(A) la masse de l'espèce A et <b>m la masse du mélange</b> (de tout le mélange !).</p>
<div class="example"><b>Exemple :</b> 20 g de sucre dissous dans 180 g d'eau.<br>m = 20 + 180 = 200 g ➜ p(sucre) = 100 × 20 / 200 = <b>10 %</b>.</div>
<p class="trap">⚠️ Piège : diviser par la masse d'eau (180 g) au lieu de la masse du mélange (200 g).</p>` },
    {
      id: "etat", title: "2.1 a) Températures de changement d'état", badge: JEUDI, html: () => `
<p>Les caractéristiques physiques d'une espèce chimique constituent sa <b>carte d'identité</b> et permettent de l'identifier.</p>
<div class="two"><div class="tile"><b>Un solide</b> ➜ on mesure sa <b>température de fusion</b> avec un <b>banc Kofler</b>.</div><div class="tile"><b>Un liquide</b> ➜ on mesure sa <b>température d'ébullition</b> avec un <b>thermomètre</b>.</div></div>
<div class="def"><b>Rappel :</b> un changement d'état d'un <b>corps pur</b> se fait à <b>température constante</b> (on voit un <b>palier</b> sur la courbe). Cette température <b>dépend de la pression</b>.</div>
<div class="two"><div class="tile center"><b>Eau pure</b> : palier à 100 °C${heatCurve(true, 100, { t1: 6 })}</div><div class="tile center"><b>Eau salée</b> (mélange) : pas de vrai palier${heatCurve(false, 102, { t1: 6 })}</div></div>
<p class="tip">💡 Pour savoir si un liquide est pur : on trace la courbe de chauffage. Palier bien horizontal ➜ corps pur. Température qui continue de monter ➜ mélange.</p>
<p class="tip">💡 Pour savoir dans quel état est une espèce à une température T : <b>T &lt; T<sub>fusion</sub></b> ➜ solide ; <b>T<sub>fusion</sub> &lt; T &lt; T<sub>ébullition</sub></b> ➜ liquide ; <b>T &gt; T<sub>ébullition</sub></b> ➜ gaz.</p>` },
    {
      id: "rho", title: "2.1 b) La masse volumique ρ", badge: JEUDI, html: () => `
<p>La masse volumique ρ (lettre grecque « rhô ») est <b>caractéristique</b> d'une espèce chimique.</p>
<div class="formula">ρ = <span class="frac"><span>m</span><span>V</span></span></div>
<p>m : masse de l'échantillon en <b>g</b> ; V : son volume en <b>L</b> ; ρ en <b>g·L⁻¹</b> (g/L).</p>
<div class="two"><div class="tile center"><b>Trouver m</b><br>m = ρ × V</div><div class="tile center"><b>Trouver V</b><br>V = m / ρ</div></div>
<div class="example"><b>Exemple :</b> 50 mL d'un liquide pèsent 39,5 g. Quelle est sa masse volumique ?<br>
1. Formule : ρ = m / V<br>2. Conversion : V = 50 mL = 0,050 L<br>3. Calcul : ρ = 39,5 / 0,050 = <b>790 g·L⁻¹</b><br>4. Conclusion : c'est proche de l'éthanol (789 g·L⁻¹).</div>
<table class="mini"><tr><th>Conversions à connaître</th></tr>
<tr><td>1 L = 10 dL = 100 cL = 1000 mL</td></tr><tr><td>1 mL = 1 cm³ ; 1 L = 1 dm³ ; 1 m³ = 1000 L</td></tr>
<tr><td>1 kg = 1000 g ; 1 g = 1000 mg</td></tr><tr><td>Eau : ρ = 1000 g/L = 1 g/mL = 1 kg/L</td></tr></table>` },
    {
      id: "tests", title: "2.2 Les tests chimiques (livre p. 319)", badge: `<span class="tag">après jeudi</span>`, html: () => `
<p>Un <b>test chimique</b> est une expérience dont le résultat, lorsqu'il est positif, permet de mettre en évidence la présence de certaines espèces chimiques. Il faut un <b>détecteur</b> et un <b>résultat attendu</b>. Si le test est négatif : l'espèce est absente, <b>ou</b> en quantité trop faible pour être détectée.</p>
${tubeSvg()}
<table class="mini tests"><tr><th>Espèce recherchée</th><th>Détecteur</th><th>Résultat si positif</th></tr>
${TESTS.map(t => `<tr><td>${t.sp}</td><td>${t.det}</td><td>${t.res}</td></tr>`).join("")}</table>
<p class="trap">⚠️ Corrections par rapport au tableau du cahier : l'ion calcium (oxalate d'ammonium) et l'ion sulfate (chlorure de baryum) donnent un <b>précipité blanc</b> ; seul le précipité du <b>chlorure</b> (nitrate d'argent) <b>noircit à la lumière</b>. Avec la soude, on obtient des <b>précipités</b> colorés : bleu (Cu²⁺), vert (Fe²⁺), orange/rouille (Fe³⁺), blanc (Mg²⁺).</p>` },
    {
      id: "ccm", title: "2.3 La chromatographie sur couche mince (CCM)", badge: `<span class="tag">après jeudi</span>`, html: () => `
<p>La CCM est une méthode d'analyse chimique qui permet la <b>séparation</b> et l'<b>identification</b> de certaines espèces chimiques d'un mélange. L'identification se fait <b>par comparaison avec des espèces pures</b>.</p>
${ccmSvg([{ lab: "A", spots: [0.62] }, { lab: "B", spots: [0.35] }, { lab: "M", spots: [0.62, 0.35] }, { lab: "C", spots: [0.8] }])}
<ol class="steps"><li><b>Analyse verticale</b> : un corps pur ne donne <b>qu'une tache</b> ; un mélange en donne <b>plusieurs</b>.</li>
<li><b>Analyse horizontale</b> : deux taches à la <b>même hauteur</b> correspondent à la <b>même espèce chimique</b>.</li></ol>
<p>Ici : M a 2 taches ➜ mélange. Elles sont à la hauteur de A et de B ➜ M contient A et B, pas C.</p>` },
  ];

  const methods = [
    {
      id: "m-calc", title: "Rédiger un calcul (la méthode en 4 étapes)", html: () => `
<p>En seconde, un résultat seul ne rapporte presque rien. Le prof note la <b>démarche</b>. Toujours :</p>
<ol class="steps"><li><b>Formule littérale</b> (avec des lettres) : ρ = m / V</li>
<li><b>Conversions</b> dans les bonnes unités : g, L ➜ V = 250 mL = 0,250 L</li>
<li><b>Application numérique</b> : ρ = 197 / 0,250</li>
<li><b>Résultat avec unité</b> : ρ = 788 g·L⁻¹ (puis une phrase de conclusion si on te demande d'identifier)</li></ol>
<p class="trap">⚠️ Oublier l'unité ou ne pas convertir les mL en L = erreur la plus fréquente.</p>` },
    {
      id: "m-formula", title: "Retourner la formule ρ = m / V", html: () => `
<div class="tri"><svg viewBox="0 0 160 120" class="fig" style="max-width:200px"><path d="M80 8 L152 112 L8 112 Z" class="trif"/><line x1="40" y1="66" x2="120" y2="66" class="trif"/><line x1="80" y1="66" x2="80" y2="112" class="trif"/><text x="80" y="52" class="t b big" text-anchor="middle">m</text><text x="54" y="98" class="t b big" text-anchor="middle">ρ</text><text x="106" y="98" class="t b big" text-anchor="middle">V</text></svg></div>
<p>Le triangle : on cache ce qu'on cherche.</p><ul><li>cacher <b>ρ</b> ➜ m / V</li><li>cacher <b>m</b> ➜ ρ × V</li><li>cacher <b>V</b> ➜ m / ρ</li></ul>
<p class="tip">💡 Vérifie toujours si ton résultat est logique : un liquide courant a une masse volumique entre 700 et 1500 g/L ; un métal entre 2 700 et 20 000 g/L. L'air : 1,3 g/L, donc 1000 fois plus léger que l'eau.</p>` },
    {
      id: "m-conv", title: "Les conversions sans se tromper", html: () => `
<table class="mini conv"><tr><th>kL</th><th>hL</th><th>daL</th><th>L</th><th>dL</th><th>cL</th><th>mL</th></tr><tr><td></td><td></td><td></td><td>1</td><td>0</td><td>0</td><td>0</td></tr></table>
<p>Chaque colonne = ×10. Pour passer des <b>mL aux L</b> : on <b>divise par 1000</b> (250 mL = 0,250 L). Des <b>cL aux L</b> : ÷100 (33 cL = 0,33 L).</p>
<p><b>m³ → L</b> : ×1000 (1 m³ = 1000 L). Une pièce de 4 m × 3 m × 2,5 m = 30 m³ = 30 000 L.</p>
<p><b>kg → g</b> : ×1000. <b>g → kg</b> : ÷1000.</p>` },
    {
      id: "m-traps", title: "Les pièges classiques", html: () => `
<ol class="steps">
<li>Pourcentage massique : on divise par la masse du <b>mélange</b> (soluté + solvant), pas par la masse d'eau.</li>
<li>« Eau pure » de la publicité (eau de source) = <b>mélange</b> ; seule l'eau <b>distillée</b> est un corps pur.</li>
<li>Un mélange <b>homogène</b> reste un mélange (eau salée, air).</li>
<li>La composition de l'air (79 % / 20 %) est en <b>volume</b>.</li>
<li>Banc Kofler ➜ <b>solide</b>, température de <b>fusion</b>. Thermomètre ➜ <b>liquide</b>, température d'<b>ébullition</b>.</li>
<li>Palier = corps pur. La température de changement d'état dépend de la <b>pression</b> (en montagne, l'eau bout avant 100 °C).</li>
<li>ρ en g/L : m en <b>g</b> et V en <b>L</b>. Toujours convertir avant de calculer.</li>
<li>CCM : même hauteur = même espèce ; un corps pur = une seule tache.</li></ol>` },
  ];

  const cards = [
    ["Corps pur", "Substance ne comportant qu'une seule espèce chimique (sous forme atomique ou moléculaire). Ex : fer, sucre, eau distillée."],
    ["Mélange", "Substance constituée de plusieurs espèces chimiques."],
    ["Mélange homogène", "On ne distingue qu'une seule phase à l'œil nu (eau sucrée, air)."],
    ["Mélange hétérogène", "On distingue plusieurs phases à l'œil nu (vinaigrette, eau boueuse, solution saturée)."],
    ["Composition de l'air (en volume)", "≈ 79 % de diazote N₂, 20 % de dioxygène O₂, 1 % d'autres gaz (CO₂…)."],
    ["Masse volumique de l'air", "ρ = 1,3 g·L⁻¹ à 1013 hPa et 20 °C."],
    ["Conditions normales de pression et température", "1013 hPa (hectopascals) et 20 °C."],
    ["Une solution saturée est…", "un mélange hétérogène (du solide reste au fond)."],
    ["Pourcentage massique", "p(A) = 100 × m(A) / m, avec m la masse du mélange."],
    ["Formule du saccharose (sucre)", "C₁₂H₂₂O₁₁"],
    ["Comment identifier un solide ?", "Mesurer sa température de fusion avec un banc Kofler."],
    ["Comment identifier un liquide ?", "Mesurer sa température d'ébullition avec un thermomètre (ou sa masse volumique)."],
    ["Changement d'état d'un corps pur", "Se fait à température constante (palier). Cette température dépend de la pression."],
    ["Courbe de chauffage d'un mélange", "Pas de vrai palier : la température continue d'augmenter pendant l'ébullition (ex : eau salée)."],
    ["Masse volumique (formule et unités)", "ρ = m / V ; m en g, V en L, ρ en g·L⁻¹."],
    ["m = ? ; V = ?", "m = ρ × V ; V = m / ρ"],
    ["Masse volumique de l'eau", "1000 g/L = 1 g/mL = 1 kg/L"],
    ["1 m³ = ? L ; 1 mL = ? cm³", "1 m³ = 1000 L ; 1 mL = 1 cm³"],
    ["Test du dioxygène", "Bûchette incandescente : elle se rallume."],
    ["Test du dihydrogène", "Allumette enflammée : petite détonation."],
    ["Test de l'eau", "Sulfate de cuivre anhydre (blanc) : devient bleu."],
    ["Test du dioxyde de carbone", "Eau de chaux : se trouble (précipité blanc)."],
    ["Test de l'ion chlorure Cl⁻", "Nitrate d'argent : précipité blanc qui noircit à la lumière."],
    ["Test de l'ion calcium Ca²⁺", "Oxalate d'ammonium : précipité blanc."],
    ["Test de l'ion sulfate SO₄²⁻", "Chlorure de baryum : précipité blanc."],
    ["Soude + Cu²⁺ / Fe²⁺ / Fe³⁺ / Mg²⁺", "Précipité bleu / vert / orange (rouille) / blanc."],
    ["CCM : analyse verticale", "Un corps pur donne une seule tache ; un mélange en donne plusieurs."],
    ["CCM : analyse horizontale", "Deux taches à la même hauteur = la même espèce chimique."],
  ].map(([f, b], i) => ({ id: "pc-c2-c" + i, f, b }));

  /* =========================================================
     GÉNÉRATEURS
     ========================================================= */
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const KIND = { pur: "Corps pur", homo: "Mélange homogène", hetero: "Mélange hétérogène" };
  function gen_purmel(lvl) {
    if (lvl >= 2 && Math.random() < 0.35) return pick([
      vf("Une eau minérale est un corps pur.", false, "Elle contient de l'eau et des sels minéraux dissous : c'est un <b>mélange homogène</b>.", { trap: "« Pure » dans la publicité ≠ corps pur en chimie." }),
      vf("Un mélange homogène ne contient qu'une seule espèce chimique.", false, "Un mélange contient <b>plusieurs</b> espèces chimiques ; « homogène » veut dire seulement qu'on ne voit qu'une phase."),
      vf("L'air est un mélange homogène.", true, "Plusieurs gaz (N₂, O₂, CO₂…), une seule phase visible."),
      vf("Une solution saturée d'eau salée est un mélange hétérogène.", true, "Le sel non dissous forme une deuxième phase au fond."),
      vf("Un corps pur peut être solide, liquide ou gazeux.", true, "Oui : le fer (solide), l'eau distillée (liquide), le dioxygène (gaz)."),
      vf("Le sucre (saccharose) a pour formule C₆H₁₂O₆.", false, "Le saccharose est <b>C₁₂H₂₂O₁₁</b>. C₆H₁₂O₆ est le glucose."),
    ]);
    if (lvl >= 3 && Math.random() < 0.5) {
      const k = pick(["pur", "homo", "hetero"]);
      const goods = sample(PURMEL[k], 2), bads = sample(PURMEL[k === "pur" ? "homo" : "pur"], 2).concat(sample(PURMEL[k === "hetero" ? "homo" : "hetero"], 1));
      return multi(`Coche tous les <b>${KIND[k].toLowerCase()}s</b>.`, goods, bads, `${KIND[k]}s : ${goods.join(", ")}.<br>Les autres : ${bads.join(", ")}.`);
    }
    const k = pick(["pur", "homo", "hetero"]), it = pick(PURMEL[k]);
    const why = { pur: "une seule espèce chimique", homo: "plusieurs espèces chimiques, une seule phase visible", hetero: "plusieurs espèces chimiques, plusieurs phases visibles" }[k];
    return qcm(`${cap(it)} : c'est…`, KIND[k], Object.values(KIND).filter(x => x !== KIND[k]), `${cap(it)} : ${why} ➜ <b>${KIND[k].toLowerCase()}</b>.`);
  }

  function gen_air(lvl) {
    const t = pick(lvl < 2 ? [0, 1, 2, 3] : [1, 2, 4, 5, 6]);
    if (t === 0) return qcm("Quel est le gaz <b>majoritaire</b> dans l'air ?", "Le diazote N₂ (≈ 79 %)", ["Le dioxygène O₂ (≈ 79 %)", "Le dioxyde de carbone CO₂", "Le dioxygène O₂ (≈ 50 %)"], "L'air contient ≈ <b>79 % de diazote</b>, 20 % de dioxygène, 1 % d'autres gaz.");
    if (t === 1) return qcm("Quelle est la masse volumique de l'air (à 1013 hPa et 20 °C) ?", "1,3 g·L⁻¹", ["1000 g·L⁻¹", "13 g·L⁻¹", "0,13 g·L⁻¹"], "ρ(air) = <b>1,3 g·L⁻¹</b> : 1 L d'air pèse 1,3 g (environ 770 fois moins que l'eau).");
    if (t === 2) return qcm("Les conditions normales de pression et de température sont :", "1013 hPa et 20 °C", ["1013 hPa et 0 °C", "1 hPa et 20 °C", "100 hPa et 100 °C"], "Pression <b>1013 hPa</b> (hectopascals), température <b>20 °C</b>.");
    if (t === 3) return match("Associe chaque gaz à sa proportion (en volume) dans l'air.", [["Diazote N₂", "≈ 79 %"], ["Dioxygène O₂", "≈ 20 %"], ["Autres gaz (CO₂, argon…)", "≈ 1 %"]], "79 % N₂, 20 % O₂, 1 % autres gaz.", { distractors: ["≈ 50 %"] });
    if (t === 4) { const V = pick([10, 20, 50, 60, 150, 250, 500]); const g = pick([["dioxygène", 20], ["diazote", 79]]); return num(`Quel volume de <b>${g[0]}</b> contiennent ${V} L d'air ?`, V * g[1] / 100, "L", `L'air contient ${g[1]} % de ${g[0]} (en volume).<br>V = ${g[1]} / 100 × ${V} = <b>${fmt(V * g[1] / 100)} L</b>.`); }
    if (t === 5) { const V = pick([2, 5, 10, 20, 50, 100]); return num(`Quelle est la masse de ${V} L d'air (ρ = 1,3 g·L⁻¹) ?`, 1.3 * V, "g", `m = ρ × V = 1,3 × ${V} = <b>${fmt(1.3 * V)} g</b>.`); }
    return vf("La composition de l'air (79 % de diazote, 20 % de dioxygène) est donnée en masse.", false, "C'est une composition en <b>volume</b>.");
  }

  // masse volumique : calculer ρ
  const VOLS = [[20, "mL", 0.020], [25, "mL", 0.025], [50, "mL", 0.050], [100, "mL", 0.100], [125, "mL", 0.125], [200, "mL", 0.200], [250, "mL", 0.250], [500, "mL", 0.500], [33, "cL", 0.33], [75, "cL", 0.75], [20, "cL", 0.20]];
  function gen_rho(lvl) {
    const liquid = lvl < 4 || Math.random() < 0.6;
    const sub = liquid ? pick(LIQ) : pick(SOL);
    let Vtxt, VL, conv;
    if (lvl < 2) { VL = pick([0.5, 1.5, 2, 0.25, 0.1]); Vtxt = fmt(VL) + " L"; conv = ""; }
    else if (liquid) { const v = pick(VOLS); VL = v[2]; Vtxt = v[0] + " " + v[1]; conv = `V = ${Vtxt} = ${fmt(VL)} L<br>`; }
    else { const c = pick([2, 5, 10, 20, 50]); VL = c / 1000; Vtxt = c + " cm³"; conv = `V = ${c} cm³ = ${c} mL = ${fmt(VL)} L<br>`; }
    let m = RV.round(sub.rho * VL, 1), mtxt = fmt(m) + " g", mconv = "";
    if (lvl >= 3 && m >= 1000 && Math.random() < 0.6) { mtxt = fmt(m / 1000) + " kg"; mconv = `m = ${mtxt} = ${fmt(m)} g<br>`; }
    const rho = m / VL;
    const steps = `<ol class="calc"><li>ρ = m / V</li><li>${mconv}${conv || "unités déjà en g et en L"}</li><li>ρ = ${fmt(m)} / ${fmt(VL)}</li><li><b>ρ = ${fmt(rho, 0)} g·L⁻¹</b></li></ol>`;
    if (lvl >= 4 && liquid) {
      const tab = shuffle(sample(LIQ.filter(x => x !== sub), 3).concat([sub]));
      return qcm(`Un liquide inconnu de volume <b>${Vtxt}</b> a une masse de <b>${mtxt}</b>. Identifie-le à l'aide du tableau.<table class="mini"><tr><th>Liquide</th><th>ρ (g·L⁻¹)</th></tr>${tab.map(x => `<tr><td>${x.n}</td><td>${fmt(x.rho)}</td></tr>`).join("")}</table>`, cap(sub.n), tab.filter(x => x !== sub).map(x => cap(x.n)), steps + `Valeur la plus proche dans le tableau : <b>${sub.n}</b>.`);
    }
    return num(`Un échantillon de ${sub.n} a une masse <b>m = ${mtxt}</b> pour un volume <b>V = ${Vtxt}</b>.<br>Calcule sa masse volumique en g·L⁻¹.`, rho, "g·L⁻¹", steps, { trap: conv ? "Convertir le volume en litres avant de diviser." : undefined });
  }

  function gen_rhoinv(lvl) {
    const t = pick(lvl < 2 ? [0, 1, 2] : [1, 2, 3, 3, 4]);
    if (t === 0) { const w = pick([["m", "ρ × V", ["m / V", "V / ρ", "ρ / V"]], ["V", "m / ρ", ["ρ × m", "ρ / m", "m × V"]], ["ρ", "m / V", ["m × V", "V / m", "m − V"]]]); return qcm(`On connaît la formule ρ = m / V. Comment calcule-t-on <b>${w[0]}</b> ?`, `${w[0]} = ${w[1]}`, w[2].map(x => `${w[0]} = ${x}`), `Avec le triangle m / (ρ × V) : <b>${w[0]} = ${w[1]}</b>.`); }
    if (t === 1) { const s = pick(LIQ); const v = pick(VOLS); const m = s.rho * v[2]; return num(`Quelle est la masse de <b>${v[0]} ${v[1]}</b> de ${s.n} (ρ = ${fmt(s.rho)} g·L⁻¹) ?`, m, "g", `<ol class="calc"><li>m = ρ × V</li><li>V = ${v[0]} ${v[1]} = ${fmt(v[2])} L</li><li>m = ${fmt(s.rho)} × ${fmt(v[2])}</li><li><b>m = ${fmt(m)} g</b></li></ol>`); }
    if (t === 2) { const s = pick(LIQ); const m = pick([50, 100, 158, 200, 500, 1000]); const V = m / s.rho; return num(`Quel volume (en <b>mL</b>) occupent <b>${m} g</b> de ${s.n} (ρ = ${fmt(s.rho)} g·L⁻¹) ?`, V * 1000, "mL", `<ol class="calc"><li>V = m / ρ</li><li>V = ${m} / ${fmt(s.rho)} = ${fmt(V)} L</li><li>Conversion : <b>${fmt(V * 1000, 0)} mL</b></li></ol>`, { tol: 0.02 }); }
    if (t === 3) {
      const L = pick([3, 4, 5, 6]), l = pick([2.5, 3, 4]), h = pick([2.5, 3]); const V = L * l * h, m = 1.3 * V * 1000;
      return num(`Une pièce mesure ${fmt(L)} m × ${fmt(l)} m × ${fmt(h)} m. Calcule la masse d'air qu'elle contient, en <b>kg</b> (ρ(air) = 1,3 g·L⁻¹).`, m / 1000, "kg", `<ol class="calc"><li>m = ρ × V</li><li>V = ${fmt(L)} × ${fmt(l)} × ${fmt(h)} = ${fmt(V)} m³ = ${fmt(V * 1000)} L</li><li>m = 1,3 × ${fmt(V * 1000)} = ${fmt(m)} g</li><li><b>m = ${fmt(m / 1000)} kg</b></li></ol>`, { trap: "1 m³ = 1000 L. Une pièce contient plusieurs dizaines de kg d'air !" });
    }
    const s = pick(SOL); const c = pick([2, 5, 10, 25]); const m = s.rho * c / 1000;
    return num(`Un cube de ${s.n} a un volume de ${c} cm³. Sa masse volumique est ${fmt(s.rho)} g·L⁻¹. Calcule sa masse en g.`, m, "g", `<ol class="calc"><li>m = ρ × V</li><li>V = ${c} cm³ = ${c} mL = ${fmt(c / 1000)} L</li><li>m = ${fmt(s.rho)} × ${fmt(c / 1000)}</li><li><b>m = ${fmt(m)} g</b></li></ol>`);
  }

  function gen_conv(lvl) {
    const C = [
      () => { const v = pick([250, 50, 125, 330, 750, 20, 5]); return [`${v} mL = ? L`, v / 1000, "L", `mL ➜ L : on divise par 1000. ${v} mL = <b>${fmt(v / 1000)} L</b>.`]; },
      () => { const v = pick([33, 75, 50, 20, 15]); return [`${v} cL = ? L`, v / 100, "L", `cL ➜ L : on divise par 100. <b>${fmt(v / 100)} L</b>.`]; },
      () => { const v = pick([0.5, 1.5, 0.25, 2, 0.75]); return [`${fmt(v)} L = ? mL`, v * 1000, "mL", `L ➜ mL : on multiplie par 1000. <b>${fmt(v * 1000)} mL</b>.`]; },
      () => { const v = pick([20, 100, 250, 8]); return [`${v} cm³ = ? L`, v / 1000, "L", `1 cm³ = 1 mL, donc ${v} cm³ = ${v} mL = <b>${fmt(v / 1000)} L</b>.`]; },
      () => { const v = pick([2, 30, 45, 0.5, 60]); return [`${fmt(v)} m³ = ? L`, v * 1000, "L", `1 m³ = 1000 L ➜ <b>${fmt(v * 1000)} L</b>.`]; },
      () => { const v = pick([1.2, 0.35, 2.5, 0.08]); return [`${fmt(v)} kg = ? g`, v * 1000, "g", `kg ➜ g : × 1000 ➜ <b>${fmt(v * 1000)} g</b>.`]; },
      () => { const v = pick([500, 250, 1500, 75]); return [`${v} mg = ? g`, v / 1000, "g", `mg ➜ g : ÷ 1000 ➜ <b>${fmt(v / 1000)} g</b>.`]; },
      () => { const v = pick([1, 2, 0.5]); return [`${fmt(v)} dm³ = ? L`, v, "L", `1 dm³ = 1 L ➜ <b>${fmt(v)} L</b>.`]; },
      () => { const v = pick([1000, 790, 1260]); return [`${fmt(v)} g·L⁻¹ = ? g·mL⁻¹`, v / 1000, "g·mL⁻¹", `1 L = 1000 mL, donc on divise par 1000 : <b>${fmt(v / 1000)} g·mL⁻¹</b>.`]; },
    ];
    const pool = lvl < 2 ? C.slice(0, 4) : C;
    const [p, a, u, e] = pick(pool)();
    return num(`Convertis : <b>${p}</b>`, a, u, e, { tol: 0.001 });
  }

  function gen_pct(lvl) {
    const mix = pick([["sucre", "eau", "sirop"], ["sel", "eau", "eau salée"], ["sucre", "thé", "thé sucré"], ["sel", "eau", "saumure"], ["cacao", "lait", "chocolat chaud"]]);
    const t = lvl < 2 ? 0 : lvl < 3 ? pick([0, 1]) : pick([1, 2, 3]);
    if (t === 0) { const m = pick([100, 200, 250, 400, 500]), p = pick([5, 10, 12, 20, 25, 30, 40]); const mA = m * p / 100; return num(`Un ${mix[2]} de masse totale <b>m = ${m} g</b> contient <b>${fmt(mA)} g</b> de ${mix[0]}. Calcule le pourcentage massique de ${mix[0]}.`, p, "%", `<ol class="calc"><li>p(${mix[0]}) = 100 × m(${mix[0]}) / m</li><li>p = 100 × ${fmt(mA)} / ${m}</li><li><b>p = ${p} %</b></li></ol>`); }
    if (t === 1) { const mA = pick([10, 15, 20, 25, 30, 40, 50]), mB = pick([150, 180, 200, 230, 250, 300]); const m = mA + mB, p = 100 * mA / m; return num(`On dissout <b>${mA} g</b> de ${mix[0]} dans <b>${mB} g</b> de ${mix[1]}. Calcule le pourcentage massique de ${mix[0]} dans le mélange (arrondi à 0,1 %).`, p, "%", `<ol class="calc"><li>Masse du mélange : m = ${mA} + ${mB} = ${m} g</li><li>p = 100 × ${mA} / ${m}</li><li><b>p ≈ ${fmt(p, 1)} %</b></li></ol>`, { trap: `Diviser par ${m} g (tout le mélange), pas par ${mB} g.` }); }
    if (t === 2) { const m = pick([150, 200, 250, 330, 500]), p = pick([4, 8, 10, 12, 15]); return num(`Une boisson de <b>${m} g</b> contient <b>${p} %</b> de sucre (en masse). Quelle masse de sucre contient-elle ?`, m * p / 100, "g", `<ol class="calc"><li>p = 100 × m(sucre) / m ➜ m(sucre) = p × m / 100</li><li>m(sucre) = ${p} × ${m} / 100</li><li><b>m(sucre) = ${fmt(m * p / 100)} g</b></li></ol>`); }
    const mA = pick([5, 10, 20, 30]), V = pick([100, 150, 200, 250]); const m = mA + V, p = 100 * mA / m;
    return num(`On dissout <b>${mA} g</b> de sel dans <b>${V} mL</b> d'eau (ρ(eau) = 1 g/mL). Calcule le pourcentage massique de sel (à 0,1 % près).`, p, "%", `<ol class="calc"><li>Masse d'eau : m = ρ × V = 1 × ${V} = ${V} g</li><li>Masse du mélange : ${mA} + ${V} = ${m} g</li><li>p = 100 × ${mA} / ${m}</li><li><b>p ≈ ${fmt(p, 1)} %</b></li></ol>`);
  }

  function gen_etat(lvl) {
    const t = pick(lvl < 2 ? [0, 1, 2] : [2, 3, 4, 5]);
    if (t === 0) { const s = Math.random() < 0.5; return qcm(`Pour identifier un <b>${s ? "solide" : "liquide"}</b>, on peut mesurer :`, s ? "sa température de fusion avec un banc Kofler" : "sa température d'ébullition avec un thermomètre", [s ? "sa température d'ébullition avec un banc Kofler" : "sa température de fusion avec un banc Kofler", "sa couleur avec un thermomètre", "sa masse avec un banc Kofler"], s ? "Solide ➜ <b>température de fusion</b> ➜ <b>banc Kofler</b>." : "Liquide ➜ <b>température d'ébullition</b> ➜ <b>thermomètre</b>."); }
    if (t === 1) return pick([
      vf("Le changement d'état d'un corps pur se fait à température constante.", true, "Oui : on observe un <b>palier</b> sur la courbe."),
      vf("La température d'ébullition d'un corps pur ne dépend pas de la pression.", false, "Elle <b>dépend de la pression</b> : en altitude (pression plus faible), l'eau bout avant 100 °C."),
      vf("Pendant l'ébullition de l'eau salée, la température reste parfaitement constante.", false, "L'eau salée est un <b>mélange</b> : pas de vrai palier, la température continue d'augmenter."),
      vf("Les caractéristiques physiques (températures de changement d'état, masse volumique) sont la carte d'identité d'une espèce chimique.", true, "Oui, elles permettent de l'identifier."),
    ]);
    if (t === 2) {
      const s = pick(LIQ), T = pick([-120, -50, 0, 10, 25, 37, 60, 90, 150]).valueOf();
      if (T === s.tf || T === s.teb) return gen_etat(lvl);
      const st = T < s.tf ? "Solide" : T < s.teb ? "Liquide" : "Gazeux";
      return qcm(`Le ${s.n} a une température de fusion de ${fmt(s.tf)} °C et d'ébullition de ${fmt(s.teb)} °C. Dans quel état est-il à <b>${fmt(T)} °C</b> ?`, st, ["Solide", "Liquide", "Gazeux"].filter(x => x !== st), `${T < s.tf ? `${fmt(T)} °C &lt; ${fmt(s.tf)} °C (fusion)` : T < s.teb ? `${fmt(s.tf)} °C &lt; ${fmt(T)} °C &lt; ${fmt(s.teb)} °C` : `${fmt(T)} °C &gt; ${fmt(s.teb)} °C (ébullition)`} ➜ <b>${st.toLowerCase()}</b>.`);
    }
    if (t === 3) {
      const tab = sample(KOF, 4), s = pick(tab), mes = s.tf + pick([-1, 0, 0, 1]);
      return qcm(`Un solide blanc est déposé sur un banc Kofler : il fond à <b>${mes} °C</b>. Identifie-le.<table class="mini"><tr><th>Solide</th><th>T fusion (°C)</th></tr>${tab.map(x => `<tr><td>${x.n}</td><td>${x.tf}</td></tr>`).join("")}</table>`, cap(s.n), tab.filter(x => x !== s).map(x => cap(x.n)), `Le banc Kofler donne la température de fusion : ${mes} °C ≈ ${s.tf} °C ➜ <b>${s.n}</b>.`);
    }
    if (t === 4) {
      const tab = sample(LIQ, 4), s = pick(tab);
      return qcm(`On chauffe un liquide incolore : il bout à <b>${s.teb} °C</b> (sous 1013 hPa) avec un palier. Identifie-le.<table class="mini"><tr><th>Liquide</th><th>T ébullition (°C)</th></tr>${tab.map(x => `<tr><td>${x.n}</td><td>${x.teb}</td></tr>`).join("")}</table>`, cap(s.n), tab.filter(x => x !== s).map(x => cap(x.n)), `Palier à ${s.teb} °C ➜ corps pur dont T<sub>éb</sub> = ${s.teb} °C ➜ <b>${s.n}</b>.`);
    }
    return qcm("En montagne (pression plus faible), l'eau pure bout :", "à moins de 100 °C", ["à 100 °C exactement", "à plus de 100 °C", "elle ne bout pas"], "La température de changement d'état <b>dépend de la pression</b> : quand la pression baisse, l'eau bout à <b>moins de 100 °C</b> (≈ 86 °C au sommet du Mont-Blanc).");
  }

  function gen_courbe(lvl) {
    const pure = Math.random() < 0.5;
    const t = pick(lvl < 2 ? [0] : [0, 1, 2]);
    if (t === 0) { const teb = pure ? pick([78, 100, 81, 118]) : 102; return qcm(`On chauffe un liquide et on relève sa température. D'après la courbe, ce liquide est :`, pure ? "un corps pur" : "un mélange", [pure ? "un mélange" : "un corps pur"], pure ? "La courbe présente un <b>palier</b> (température constante pendant l'ébullition) ➜ <b>corps pur</b>." : "Pas de palier : la température continue d'augmenter pendant l'ébullition ➜ <b>mélange</b> (comme l'eau salée).", { fig: heatCurve(pure, teb) }); }
    const s = pick(LIQ.filter(x => x.teb <= 120 && x.teb >= 40));
    if (t === 1) return num(`Lis sur la courbe la température d'ébullition de ce corps pur.`, s.teb, "°C", `Le palier se situe à environ <b>${s.teb} °C</b>.`, { fig: heatCurve(true, s.teb), tol: 0.04 });
    const tab = shuffle(sample(LIQ.filter(x => x !== s && Math.abs(x.teb - s.teb) > 8), 3).concat([s]));
    return qcm(`Voici la courbe de chauffage d'un liquide pur. Identifie-le.<table class="mini"><tr><th>Liquide</th><th>T ébullition (°C)</th></tr>${tab.map(x => `<tr><td>${x.n}</td><td>${x.teb}</td></tr>`).join("")}</table>`, cap(s.n), tab.filter(x => x !== s).map(x => cap(x.n)), `Palier à ≈ ${s.teb} °C ➜ <b>${s.n}</b>.`, { fig: heatCurve(true, s.teb) });
  }

  function gen_tests(lvl) {
    const T = pick(TESTS), t = pick(lvl < 2 ? [0, 1] : [0, 1, 2, 3]);
    if (t === 0) return qcm(`Quel détecteur utilise-t-on pour mettre en évidence : <b>${T.sp}</b> ?`, cap(T.det), [...new Set(TESTS.map(x => x.det))].filter(x => x !== T.det).slice(0).sort(() => Math.random() - 0.5).slice(0, 3).map(cap), `${T.sp} ➜ ${T.det} ➜ ${T.res}.`);
    if (t === 1) { const others = [...new Set(TESTS.map(x => x.res))].filter(x => x !== T.res); return qcm(`${T.sp} : on ajoute ${T.det}. Quel est le résultat si le test est positif ?`, cap(T.res), sample(others, 3).map(cap), `${T.sp} + ${T.det} ➜ <b>${T.res}</b>.`); }
    if (t === 2) { const S = sample(TESTS.filter(x => x.det.includes("soude")), 4); return match("Avec la soude (hydroxyde de sodium), associe chaque ion à la couleur du précipité.", S.map(x => [x.sp, x.res]), S.map(x => `${x.sp} : ${x.res}`).join("<br>")); }
    return qcm(`On ajoute <b>${T.det}</b> et on observe : <b>${T.res}</b>. Quelle espèce est présente ?`, T.sp, sample(TESTS.filter(x => x !== T), 3).map(x => x.sp), `${cap(T.det)} ➜ ${T.res} : c'est le test de <b>${T.sp}</b>.`);
  }

  function gen_ccm(lvl) {
    const t = pick(lvl < 2 ? [0, 1] : [1, 2, 3]);
    if (t === 0) return pick([
      qcm("En CCM, un corps pur donne :", "une seule tache", ["plusieurs taches", "aucune tache", "une tache sur la ligne de dépôt"], "Analyse verticale : <b>corps pur = une seule tache</b>."),
      qcm("En CCM, deux taches à la même hauteur correspondent :", "à la même espèce chimique", ["à deux espèces différentes", "à un mélange", "à une erreur de dépôt"], "Analyse horizontale : même hauteur = <b>même espèce</b>."),
      qcm("La CCM permet de :", "séparer et identifier les espèces d'un mélange", ["mesurer une masse volumique", "mesurer une température de fusion", "créer de nouvelles espèces"], "La CCM <b>sépare</b> les espèces et les <b>identifie</b> par comparaison avec des espèces pures."),
    ]);
    const H = shuffle([0.25, 0.45, 0.65, 0.82]);
    const refs = ["A", "B", "C"].map((l, i) => ({ lab: l, h: H[i] }));
    const inM = sample(refs, lvl >= 3 ? rnd(1, 3) : rnd(2, 3)).sort((a, b) => a.lab < b.lab ? -1 : 1);
    const unknown = lvl >= 4 && Math.random() < 0.4;
    const spots = inM.map(r => r.h).concat(unknown ? [H[3]] : []);
    const deps = [refs[0], refs[1], { lab: "M", h: null }, refs[2]].map(d => d.lab === "M" ? { lab: "M", spots } : { lab: d.lab, spots: [d.h] });
    const fig = ccmSvg(deps);
    if (t === 1) return multi("Voici le chromatogramme d'un mélange M et de trois espèces pures A, B, C. Quelles espèces contient M ?", inM.map(r => r.lab), refs.filter(r => !inM.includes(r)).map(r => r.lab), `Taches de M à la même hauteur que : <b>${inM.map(r => r.lab).join(", ")}</b>.${unknown ? " Une tache de M ne correspond à aucune référence : M contient aussi une espèce non identifiée." : ""}`, { fig });
    if (t === 2) return num("Combien d'espèces chimiques (au moins) contient le mélange M ?", spots.length, "", `M présente <b>${spots.length}</b> tache(s) ➜ au moins ${spots.length} espèce(s).`, { fig });
    return qcm("D'après ce chromatogramme, M est :", spots.length > 1 ? "un mélange" : "un corps pur (une seule tache)", [spots.length > 1 ? "un corps pur (une seule tache)" : "un mélange"], spots.length > 1 ? `M donne ${spots.length} taches ➜ <b>mélange</b>.` : "M ne donne qu'une tache ➜ peut-être un <b>corps pur</b>.", { fig });
  }

  function gen_redac(lvl) {
    const t = pick([0, 1, 2]);
    if (t === 0) {
      const L = pick([4, 5]), l = pick([3, 3.5]), h = 2.5, V = L * l * h, m = 1.3 * V * 1000;
      return redac(`Calcule la masse d'air contenue dans une chambre de ${fmt(L)} m × ${fmt(l)} m × ${fmt(h)} m (ρ(air) = 1,3 g·L⁻¹). Rédige toutes les étapes, puis compare avec ta réponse.`, ["J'ai écrit la formule littérale m = ρ × V", `J'ai calculé V = ${fmt(V)} m³ et converti en ${fmt(V * 1000)} L`, `J'ai fait l'application numérique 1,3 × ${fmt(V * 1000)}`, `Résultat avec unité : ${fmt(m)} g, soit ${fmt(m / 1000)} kg`], `m = ρ × V<br>V = ${fmt(L)} × ${fmt(l)} × ${fmt(h)} = ${fmt(V)} m³ = ${fmt(V * 1000)} L<br>m = 1,3 × ${fmt(V * 1000)} = ${fmt(m)} g<br><b>m ≈ ${fmt(m / 1000)} kg</b> d'air.`);
    }
    if (t === 1) {
      const s = pick(LIQ.filter(x => x.n !== "eau")), v = pick(VOLS.filter(x => x[1] === "mL")), mass = RV.round(s.rho * v[2], 1);
      return redac(`Un liquide inconnu de volume ${v[0]} mL a une masse de ${fmt(mass)} g. Montre qu'il peut s'agir de ${s.n} (ρ = ${fmt(s.rho)} g·L⁻¹). Rédige.`, ["Formule ρ = m / V", `Conversion V = ${v[0]} mL = ${fmt(v[2])} L`, `Calcul ρ = ${fmt(mass)} / ${fmt(v[2])} ≈ ${fmt(mass / v[2], 0)} g·L⁻¹`, `Phrase de conclusion comparant à ${fmt(s.rho)} g·L⁻¹`], `ρ = m / V<br>V = ${v[0]} mL = ${fmt(v[2])} L<br>ρ = ${fmt(mass)} / ${fmt(v[2])} ≈ <b>${fmt(mass / v[2], 0)} g·L⁻¹</b><br>Cette valeur est égale (ou très proche) de la masse volumique du ${s.n} (${fmt(s.rho)} g·L⁻¹) : le liquide peut être du ${s.n}.`);
    }
    return redac("Comment savoir si un liquide incolore est de l'eau pure ou de l'eau salée ? Propose une expérience et dis ce que tu attends.", ["On chauffe le liquide et on relève la température régulièrement (thermomètre)", "On trace la courbe température en fonction du temps", "Eau pure (corps pur) : palier à 100 °C (sous 1013 hPa)", "Eau salée (mélange) : pas de vrai palier, la température continue de monter"], "On chauffe le liquide en relevant la température avec un thermomètre, puis on trace la courbe. Si on observe un <b>palier à 100 °C</b> (sous 1013 hPa), c'est un <b>corps pur</b> : de l'eau pure. Si la température <b>continue d'augmenter</b> pendant l'ébullition (et dépasse 100 °C), c'est un <b>mélange</b> : de l'eau salée. On pourrait aussi mesurer sa masse volumique (eau pure : 1000 g·L⁻¹, eau salée : plus).");
  }

  RV.addChapter({
    id: "pc-c2", subject: "pc", code: "C2",
    title: "Corps purs et mélanges",
    long: "Corps purs et mélanges au quotidien",
    examKey: "pc",
    lesson, methods, cards,
    skills: [
      { id: "pc.purmel", name: "Corps pur ou mélange ?", short: "homogène, hétérogène", lesson: "purmel", gen: gen_purmel },
      { id: "pc.air", name: "L'air", short: "79 % N₂, 20 % O₂, 1,3 g/L", lesson: "purmel", gen: gen_air },
      { id: "pc.pct", name: "Pourcentage massique", short: "p(A) = 100 × m(A) / m", lesson: "purmel", gen: gen_pct },
      { id: "pc.etat", name: "Changements d'état", short: "banc Kofler, état à une température", lesson: "etat", gen: gen_etat },
      { id: "pc.courbe", name: "Lire une courbe de chauffage", short: "palier : corps pur ou mélange ?", lesson: "etat", gen: gen_courbe },
      { id: "pc.conv", name: "Conversions", short: "mL → L, m³ → L, kg → g", lesson: "rho", gen: gen_conv },
      { id: "pc.rho", name: "Calculer ρ = m / V", short: "et identifier une espèce", lesson: "rho", gen: gen_rho },
      { id: "pc.rhoinv", name: "Calculer m ou V", short: "m = ρ × V ; V = m / ρ", lesson: "rho", gen: gen_rhoinv },
      { id: "pc.redac", name: "Rédiger un calcul / une expérience", short: "formule, conversion, calcul, unité", lesson: "rho", gen: gen_redac, selfGraded: true },
      { id: "pc.tests", name: "Tests chimiques", short: "détecteur et résultat", lesson: "tests", gen: gen_tests, later: true },
      { id: "pc.ccm", name: "Lire une CCM", short: "taches, même hauteur", lesson: "ccm", gen: gen_ccm, later: true },
    ],
    exam: [["pc.purmel", 2], ["pc.air", 2], ["pc.pct", 2], ["pc.etat", 2], ["pc.courbe", 2], ["pc.conv", 2], ["pc.rho", 3], ["pc.rhoinv", 3], ["pc.redac", 2]],
    examLater: [["pc.tests", 2], ["pc.ccm", 2]],
  });
  RV._pc = { heatCurve, ccmSvg, LIQ, TESTS };
})(typeof window !== "undefined" ? window : globalThis);
