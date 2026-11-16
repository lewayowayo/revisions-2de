# Révisions 2de (Emma)

Appli de révision de seconde, construite à partir des cours du cahier. Une matière = un ou plusieurs chapitres.

- **SVT, chapitre A3** : le métabolisme des cellules (3 voies métaboliques, organites, autotrophe/hétérotrophe, enzymes, TP7 levures Rho⁺/Rho⁻, TP8 immunodiffusion).
- **Physique-chimie, chapitre 2** : corps purs et mélanges (air, pourcentage massique, changements d'état, masse volumique ; tests chimiques et CCM marqués « après jeudi »).

Pour chaque chapitre :
- **Cours** : la fiche du cahier réorganisée, avec schémas, plus une partie « Méthodes et pièges » (rédaction « j'observe / je sais / j'en déduis », calcul en 4 étapes, conversions).
- **Cartes** : cartes mémoire à répétition espacée (1, 2, 4, 8, 16 jours).
- **Exos** : 11 compétences par chapitre, questions générées à l'infini (QCM, vrai/faux, calculs avec unités, associations, remise en ordre, lecture de graphiques, de gels, de chromatogrammes, rédactions auto-corrigées). Le niveau monte après 2 ou 3 réussites d'affilée et descend à chaque erreur ; une erreur fait revenir une question du même type 3 questions plus loin, avec un lien vers le passage du cours.
- **Contrôle** : contrôle blanc de 20 questions, sans correction avant la fin, note sur 20, correction détaillée et compétences à retravailler.
- Parcours du jour (priorité au contrôle le plus proche), objectif quotidien, série de jours, XP, badges.

Progression stockée sur le téléphone (localStorage), sans compte ; fonctionne hors ligne une fois ajoutée à l'écran d'accueil.

## Ajouter un chapitre
1. Créer `ch-<matière>-<code>.js` sur le modèle de `ch-pc-c2.js` (leçon, méthodes, cartes, compétences avec générateurs, plan du contrôle blanc) et l'enregistrer avec `RV.addChapter`.
2. L'ajouter dans `index.html` (balise script), `sw.js` (FILES) et `test/run.js`, puis monter le numéro `?v=` partout.
3. `node test/run.js` : génère ~50 000 questions et vérifie qu'elles sont cohérentes.

## Notes sur le contenu
- La partie SVT « 2) métabolisme des cellules chlorophylliennes » n'était pas sur les photos : elle est rédigée d'après le programme (à vérifier avec le cahier).
- Corrections par rapport au cahier : saccharose = C₁₂H₂₂O₁₁ ; tests du calcium et du sulfate = précipité blanc (seul le chlorure noircit à la lumière) ; Fe³⁺ + soude = précipité orange/rouille.

Tester en local : `python3 -m http.server 8765` puis http://localhost:8765
