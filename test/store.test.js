import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { addVisite, emptyState, getVisite, listVisites, removeVisite } from "../src/store.js";

const VISITE = { client: "Mairie", ville: "Tours", date: "2026-09-30", statut: "planifiee", compteRendu: "" };

describe("store", () => {
  it("part d'un etat vide", () => {
    const etat = emptyState();
    assert.deepEqual(listVisites(etat), []);
    assert.equal(etat.nextId, 1);
  });

  it("ajoute une visite et incremente l'identifiant", () => {
    const { state, visite } = addVisite(emptyState(), VISITE);
    assert.equal(visite.id, 1);
    assert.equal(state.nextId, 2);
    assert.equal(listVisites(state).length, 1);
  });

  it("ne mute jamais l'etat d'origine", () => {
    const origine = emptyState();
    addVisite(origine, VISITE);
    assert.deepEqual(listVisites(origine), [], "l'etat d'origine doit rester vide");
  });

  it("retrouve une visite par identifiant", () => {
    const { state } = addVisite(emptyState(), VISITE);
    assert.equal(getVisite(state, 1).client, "Mairie");
    assert.equal(getVisite(state, 99), null);
  });

  it("supprime une visite existante et signale l'absence", () => {
    const { state } = addVisite(emptyState(), VISITE);
    const ok = removeVisite(state, 1);
    assert.equal(ok.supprimee, true);
    assert.equal(listVisites(ok.state).length, 0);

    const ko = removeVisite(state, 42);
    assert.equal(ko.supprimee, false);
    assert.equal(listVisites(ko.state).length, 1);
  });

  it("rend une copie de la liste, pas la reference interne", () => {
    const { state } = addVisite(emptyState(), VISITE);
    listVisites(state).push({ id: 999 });
    assert.equal(listVisites(state).length, 1);
  });
});
