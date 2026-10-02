// Validation aux frontières : rien n'entre dans le store sans passer ici.

export const STATUTS = ["planifiee", "realisee", "annulee"];

export const COULEURS_CR = ["rouge", "bleu", "vert", "orange"];

const texte = (v) => (typeof v === "string" ? v.trim() : "");

const JETONS_CR = /(<u>|<\/u>|<span class="cr-[a-z]+">|<\/span>|<br>|&(?:amp|lt|gt|quot|#39);)/;
const ECHAPPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const ERR_IMBRIQUE = "compteRendu : balisage mal imbriqué";
const ERR_COULEUR = "compteRendu : couleur inconnue";

// Liste blanche : seuls <u>, <br>, <span class="cr-X"> et cinq entités survivent,
// tout le reste est neutralisé en texte. Le front injecte ce HTML tel quel.
export function normaliserCompteRendu(brut) {
  const erreurs = [];
  const pile = [];
  let html = "";
  let visible = "";
  let longueurVisible = 0;
  const signaler = (message) => { if (!erreurs.includes(message)) erreurs.push(message); };

  brut.split(JETONS_CR).forEach((morceau, i) => {
    if (i % 2 === 0) {
      html += morceau.replace(/[&<>]/g, (c) => ECHAPPE[c]).replace(/\r?\n/g, "<br>");
      visible += morceau;
      longueurVisible += morceau.replace(/\r?\n/g, "\n").length;
    } else if (morceau.startsWith("&")) {
      html += morceau;
      visible += "x";
      longueurVisible += 1;
    } else if (morceau === "<br>") {
      html += morceau;
    } else if (morceau === "<u>") {
      pile.push("u");
      html += morceau;
    } else if (morceau === "</u>" || morceau === "</span>") {
      if (pile.pop() !== morceau.slice(2, -1)) signaler(ERR_IMBRIQUE);
      html += morceau;
    } else {
      pile.push("span");
      if (COULEURS_CR.includes(morceau.slice('<span class="cr-'.length, -2))) html += morceau;
      else signaler(ERR_COULEUR);
    }
  });
  if (pile.length) signaler(ERR_IMBRIQUE);

  return { html: visible.trim() ? html : "", longueurVisible, erreurs };
}

export function validateVisite(entree) {
  const erreurs = [];
  const o = entree && typeof entree === "object" ? entree : {};

  const client = texte(o.client);
  const ville = texte(o.ville);
  const date = texte(o.date);
  const statut = texte(o.statut) || "planifiee";
  const brut = texte(o.compteRendu);
  const cr = normaliserCompteRendu(brut);

  if (client.length < 2) erreurs.push("client : 2 caractères minimum");
  if (ville.length < 2) erreurs.push("ville : 2 caractères minimum");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) erreurs.push("date : format attendu AAAA-MM-JJ");
  if (!STATUTS.includes(statut)) erreurs.push(`statut : valeurs admises ${STATUTS.join(", ")}`);
  erreurs.push(...cr.erreurs);
  if (cr.longueurVisible > 500) erreurs.push("compteRendu : 500 caractères maximum");
  if (brut.length > 5000) erreurs.push("compteRendu : contenu trop volumineux");

  return erreurs.length
    ? { ok: false, erreurs }
    : { ok: true, valeur: { client, ville, date, statut, compteRendu: cr.html } };
}
