import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { handleCreate, handleStatistiques } from "../src/api.js";
import { emptyState } from "../src/store.js";

const VALIDE = { client: "Mairie de Tours", ville: "Tours", date: "2026-09-30" };

describe("api statistiques", () => {
  it("rend les trois statuts a zero sur un carnet vide", () => {
    const r = handleStatistiques(emptyState());
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { total: 0, parStatut: { planifiee: 0, realisee: 0, annulee: 0 } });
  });

  it("compte le total et chaque statut", () => {
    let etat = emptyState();
    for (const statut of ["planifiee", "realisee", "realisee"]) {
      etat = handleCreate(etat, { ...VALIDE, statut }).state;
    }
    const r = handleStatistiques(etat);
    assert.equal(r.body.total, 3);
    assert.deepEqual(r.body.parStatut, { planifiee: 1, realisee: 2, annulee: 0 });
  });

  it("ne modifie pas l'etat", () => {
    const etat = handleCreate(emptyState(), VALIDE).state;
    assert.equal(handleStatistiques(etat).state, etat);
  });
});
