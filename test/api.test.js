import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { handleCreate, handleDelete, handleGet, handleList } from "../src/api.js";
import { emptyState } from "../src/store.js";

const VALIDE = { client: "Mairie de Tours", ville: "Tours", date: "2026-09-30" };
const avecUne = () => handleCreate(emptyState(), VALIDE).state;

describe("api", () => {
  it("liste les visites", () => {
    const r = handleList(avecUne());
    assert.equal(r.status, 200);
    assert.equal(r.body.visites.length, 1);
  });

  it("cree une visite et rend 201 avec l'objet complet", () => {
    const r = handleCreate(emptyState(), VALIDE);
    assert.equal(r.status, 201);
    assert.equal(r.body.id, 1);
    assert.equal(r.body.statut, "planifiee");
  });

  it("refuse une creation invalide en 400 avec le detail des erreurs", () => {
    const r = handleCreate(emptyState(), { client: "M" });
    assert.equal(r.status, 400);
    assert.equal(r.body.erreur, "validation");
    assert.ok(r.body.details.length > 0);
  });

  it("ne modifie pas l'etat quand la creation est refusee", () => {
    const etat = emptyState();
    const r = handleCreate(etat, {});
    assert.equal(r.state, etat);
  });

  it("rend 200 sur une visite connue et 404 sinon", () => {
    const etat = avecUne();
    assert.equal(handleGet(etat, 1).status, 200);
    assert.equal(handleGet(etat, 404).status, 404);
  });

  it("supprime en 204 et rend 404 sur une visite deja absente", () => {
    const etat = avecUne();
    const premier = handleDelete(etat, 1);
    assert.equal(premier.status, 204);
    assert.equal(premier.body, null);
    assert.equal(handleDelete(premier.state, 1).status, 404);
  });
});
