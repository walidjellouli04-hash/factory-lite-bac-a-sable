// Couche API : fonctions pures (state, entrée) -> { state, status, body }.
// Aucun objet HTTP ici — c'est ce qui rend les tests lisibles et rapides.

import { addVisite, getVisite, listVisites, removeVisite } from "./store.js";
import { validateVisite } from "./validate.js";

export function handleList(state) {
  return { state, status: 200, body: { visites: listVisites(state) } };
}

export function handleGet(state, id) {
  const visite = getVisite(state, id);
  return visite
    ? { state, status: 200, body: visite }
    : { state, status: 404, body: { erreur: "visite introuvable" } };
}

// Champs effectivement enregistres a la creation d'une visite.
const CHAMPS_ENREGISTRES = ["client", "ville", "date", "statut"];

export function handleCreate(state, entree) {
  const controle = validateVisite(entree);
  if (!controle.ok) {
    return { state, status: 400, body: { erreur: "validation", details: controle.erreurs } };
  }
  const donnees = Object.fromEntries(
    CHAMPS_ENREGISTRES.map((champ) => [champ, controle.valeur[champ]]),
  );
  const { state: suivant, visite } = addVisite(state, donnees);
  return { state: suivant, status: 201, body: visite };
}

export function handleDelete(state, id) {
  const { state: suivant, supprimee } = removeVisite(state, id);
  return supprimee
    ? { state: suivant, status: 204, body: null }
    : { state, status: 404, body: { erreur: "visite introuvable" } };
}
