import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { STATUTS, validateVisite } from "../src/validate.js";

const VALIDE = { client: "Mairie de Tours", ville: "Tours", date: "2026-09-30" };

describe("validate", () => {
  it("accepte une visite minimale et applique le statut par defaut", () => {
    const r = validateVisite(VALIDE);
    assert.equal(r.ok, true);
    assert.equal(r.valeur.statut, "planifiee");
    assert.equal(r.valeur.compteRendu, "");
  });

  it("nettoie les espaces autour des champs", () => {
    const r = validateVisite({ ...VALIDE, client: "  Mairie  ", ville: " Tours " });
    assert.equal(r.valeur.client, "Mairie");
    assert.equal(r.valeur.ville, "Tours");
  });

  it("refuse un client ou une ville trop court", () => {
    assert.equal(validateVisite({ ...VALIDE, client: "M" }).ok, false);
    assert.equal(validateVisite({ ...VALIDE, ville: "" }).ok, false);
  });

  it("refuse une date mal formee", () => {
    for (const date of ["30/09/2026", "2026-9-30", "", "demain"]) {
      assert.equal(validateVisite({ ...VALIDE, date }).ok, false, "date refusee : " + date);
    }
  });

  it("refuse un statut hors liste et accepte tous les statuts admis", () => {
    assert.equal(validateVisite({ ...VALIDE, statut: "brouillon" }).ok, false);
    for (const statut of STATUTS) {
      assert.equal(validateVisite({ ...VALIDE, statut }).ok, true, "statut admis : " + statut);
    }
  });

  it("refuse un compte rendu trop long", () => {
    assert.equal(validateVisite({ ...VALIDE, compteRendu: "x".repeat(501) }).ok, false);
    assert.equal(validateVisite({ ...VALIDE, compteRendu: "x".repeat(500) }).ok, true);
  });

  it("ne casse pas sur une entree absente ou du mauvais type", () => {
    for (const entree of [null, undefined, 42, "texte", []]) {
      const r = validateVisite(entree);
      assert.equal(r.ok, false);
      assert.ok(Array.isArray(r.erreurs) && r.erreurs.length > 0);
    }
  });

  it("cumule toutes les erreurs au lieu de s'arreter a la premiere", () => {
    const r = validateVisite({ client: "", ville: "", date: "nope", statut: "zzz" });
    assert.equal(r.erreurs.length, 4);
  });
});
