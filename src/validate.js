// Validation aux frontières : rien n'entre dans le store sans passer ici.

export const STATUTS = ["planifiee", "realisee", "annulee"];

const texte = (v) => (typeof v === "string" ? v.trim() : "");

export function validateVisite(entree) {
  const erreurs = [];
  const o = entree && typeof entree === "object" ? entree : {};

  const client = texte(o.client);
  const ville = texte(o.ville);
  const date = texte(o.date);
  const statut = texte(o.statut) || "planifiee";
  const compteRendu = texte(o.compteRendu);

  if (client.length < 2) erreurs.push("client : 2 caractères minimum");
  if (ville.length < 2) erreurs.push("ville : 2 caractères minimum");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) erreurs.push("date : format attendu AAAA-MM-JJ");
  if (!STATUTS.includes(statut)) erreurs.push(`statut : valeurs admises ${STATUTS.join(", ")}`);
  if (compteRendu.length > 500) erreurs.push("compteRendu : 500 caractères maximum");

  return erreurs.length
    ? { ok: false, erreurs }
    : { ok: true, valeur: { client, ville, date, statut, compteRendu } };
}
