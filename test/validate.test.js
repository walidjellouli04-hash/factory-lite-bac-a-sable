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

describe("validate : compte rendu enrichi", () => {
  const cr = (compteRendu) => validateVisite({ ...VALIDE, compteRendu });

  it("conserve <u>, <span class=cr-X> et <br>", () => {
    const html = 'a <u>b</u> <span class="cr-rouge">c</span><br>d';
    const r = cr(html);
    assert.equal(r.ok, true);
    assert.equal(r.valeur.compteRendu, html);
  });

  it("neutralise les balises hors liste blanche", () => {
    for (const brut of ['<script>alert(1)</script>', '<u onclick="x">a', '<span style="color:red">a']) {
      const r = cr(brut);
      assert.equal(r.ok, true);
      assert.ok(!/<(script|span style|u onclick)/.test(r.valeur.compteRendu));
      assert.ok(r.valeur.compteRendu.includes("&lt;"));
    }
    assert.equal(cr("<script>x</script>").valeur.compteRendu, "&lt;script&gt;x&lt;/script&gt;");
  });

  it("refuse une couleur inconnue", () => {
    assert.equal(cr('<span class="cr-violet">x</span>').ok, false);
  });

  it("refuse un balisage mal imbrique", () => {
    assert.equal(cr("<u>abc").ok, false);
    assert.equal(cr('<u><span class="cr-bleu">x</u></span>').ok, false);
    assert.equal(cr("x</u>").ok, false);
  });

  it("calcule la longueur sur le texte visible", () => {
    assert.equal(cr("<u>" + "x".repeat(500) + "</u>").ok, true);
    assert.equal(cr("<u>" + "x".repeat(501) + "</u>").ok, false);
  });

  it("echappe & et convertit les sauts de ligne", () => {
    assert.equal(cr("R&D").valeur.compteRendu, "R&amp;D");
    assert.equal(cr("a\nb").valeur.compteRendu, "a<br>b");
  });

  it("rend une chaine vide pour un contenu sans texte", () => {
    assert.equal(cr("<br>").valeur.compteRendu, "");
    assert.equal(cr("   ").valeur.compteRendu, "");
    assert.equal(cr("<u> </u><br>").valeur.compteRendu, "");
  });

  it("refuse une chaine brute de plus de 5000 caracteres", () => {
    const r = cr("<u></u>".repeat(800));
    assert.equal(r.ok, false);
    assert.ok(r.erreurs.includes("compteRendu : contenu trop volumineux"));
  });
});

import { PRIORITES } from "../src/validate.js";

describe("validate : priorite", () => {
  it("vaut normale quand le champ est absent", () => {
    const r = validateVisite(VALIDE);
    assert.equal(r.ok, true);
    assert.equal(r.valeur.priorite, "normale");
  });

  it("accepte chaque priorite admise a l'identique", () => {
    for (const p of PRIORITES) {
      const r = validateVisite({ ...VALIDE, priorite: p });
      assert.equal(r.ok, true);
      assert.equal(r.valeur.priorite, p);
    }
  });

  it("nettoie les espaces autour de la valeur", () => {
    assert.equal(validateVisite({ ...VALIDE, priorite: " haute " }).valeur.priorite, "haute");
  });

  it("refuse les valeurs inconnues", () => {
    for (const p of ["urgente", "HAUTE", 42]) {
      const r = validateVisite({ ...VALIDE, priorite: p });
      assert.equal(r.ok, false);
      assert.ok(r.erreurs.some((e) => e.startsWith("priorite :")));
    }
  });
});
