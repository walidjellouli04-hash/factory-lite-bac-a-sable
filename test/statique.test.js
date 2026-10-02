import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { cheminDemande } from "../src/statique.js";

describe("statique", () => {
  it("sert la page d'accueil pour la racine", () => {
    assert.equal(cheminDemande("/"), "index.html");
    assert.equal(cheminDemande(""), "index.html");
    assert.equal(cheminDemande(undefined), "index.html");
  });

  it("ignore la chaine de requete avant de decider", () => {
    // Un rechargement anti-cache demande `/?t=1759...` : c'est la racine.
    assert.equal(cheminDemande("/?t=1759238400123"), "index.html");
    assert.equal(cheminDemande("/style.css?v=2"), "style.css");
    assert.equal(cheminDemande("/app.js?"), "app.js");
  });

  it("ignore l'ancre", () => {
    assert.equal(cheminDemande("/#section"), "index.html");
    assert.equal(cheminDemande("/app.js#L10"), "app.js");
  });

  it("rend le chemin d'un fichier demande", () => {
    assert.equal(cheminDemande("/style.css"), "style.css");
    assert.equal(cheminDemande("/sous/dossier/x.js"), "sous/dossier/x.js");
  });

  it("decode les sequences d'echappement", () => {
    assert.equal(cheminDemande("/mon%20fichier.css"), "mon fichier.css");
  });

  it("refuse une remontee d'arborescence", () => {
    for (const url of ["/../secret", "/a/../../secret", "/..%2Fsecret", "/a\\..\\b"]) {
      assert.equal(cheminDemande(url), null, `refuse : ${url}`);
    }
  });

  it("refuse un octet nul et un echappement invalide", () => {
    assert.equal(cheminDemande("/a%00b"), null);
    assert.equal(cheminDemande("/%E0%A4%A"), null);
  });
});
