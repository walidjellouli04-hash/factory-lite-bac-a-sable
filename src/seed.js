// Jeu d'amorçage — données fictives, jamais de donnée réelle dans ce dépôt.

import { addVisite, emptyState } from "./store.js";

const AMORCE = [
  { client: "Mairie de Vouvray", ville: "Vouvray", date: "2026-09-12", statut: "realisee",
    compteRendu: "Relevé du seuil de la salle des fêtes. Devis attendu." },
  { client: "Camping des Deux Rives", ville: "Amboise", date: "2026-09-24", statut: "realisee",
    compteRendu: "Trois accès à protéger, contrainte de largeur sur le portail nord." },
  { client: "Syndicat des eaux", ville: "Tours", date: "2026-10-08", statut: "planifiee",
    compteRendu: "" },
];

export const seededState = () =>
  AMORCE.reduce((etat, v) => addVisite(etat, v).state, emptyState());
