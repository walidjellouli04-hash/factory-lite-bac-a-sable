// Serveur HTTP du carnet de visites. node:http uniquement, aucune dépendance.
// Le serveur ne fait que traduire HTTP <-> fonctions pures de src/api.js.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleCreate, handleDelete, handleGet, handleList, handleStatistiques } from "./src/api.js";
import { seededState } from "./src/seed.js";
import { cheminDemande } from "./src/statique.js";

const RACINE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(RACINE, "public");
const PORT = Number(process.env.PORT || 7788);

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
                ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

let etat = seededState();

const envoyer = (res, status, body) => {
  if (body === null) return res.writeHead(status).end();
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8",
                          "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
};

const lireCorps = (req) =>
  new Promise((resolve) => {
    let brut = "";
    req.on("data", (c) => {
      brut += c;
      if (brut.length > 100_000) req.destroy();   // plafond : jamais de corps illimité
    });
    req.on("end", () => { try { resolve(JSON.parse(brut || "{}")); } catch { resolve(null); } });
    req.on("error", () => resolve(null));
  });

function servirStatique(req, res) {
  const rel = cheminDemande(req.url);
  if (rel === null) return envoyer(res, 400, { erreur: "chemin refuse" });
  const cible = path.join(PUBLIC, rel);
  if (!cible.startsWith(PUBLIC)) return envoyer(res, 403, { erreur: "interdit" });
  fs.readFile(cible, (err, buf) => {
    if (err) return envoyer(res, 404, { erreur: "introuvable" });
    res.writeHead(200, { "Content-Type": TYPES[path.extname(cible)] || "application/octet-stream" });
    res.end(buf);
  });
}

const serveur = http.createServer(async (req, res) => {
  const chemin = (req.url || "/").split("?")[0];

  if (chemin === "/api/visites" && req.method === "GET") {
    const r = handleList(etat); etat = r.state; return envoyer(res, r.status, r.body);
  }
  if (chemin === "/api/visites/statistiques" && req.method === "GET") {
    const r = handleStatistiques(etat); etat = r.state; return envoyer(res, r.status, r.body);
  }
  if (chemin === "/api/visites" && req.method === "POST") {
    const corps = await lireCorps(req);
    if (corps === null) return envoyer(res, 400, { erreur: "JSON invalide" });
    const r = handleCreate(etat, corps); etat = r.state; return envoyer(res, r.status, r.body);
  }
  const m = chemin.match(/^\/api\/visites\/(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    if (req.method === "GET")    { const r = handleGet(etat, id);    etat = r.state; return envoyer(res, r.status, r.body); }
    if (req.method === "DELETE") { const r = handleDelete(etat, id); etat = r.state; return envoyer(res, r.status, r.body); }
    return envoyer(res, 405, { erreur: "méthode non autorisée" });
  }
  if (chemin.startsWith("/api/")) return envoyer(res, 404, { erreur: "route inconnue" });

  return servirStatique(req, res);
});

serveur.on("error", (e) => {
  console.error(e.code === "EADDRINUSE"
    ? `Le port ${PORT} est deja utilise. Relance avec PORT=${PORT + 1} npm start.`
    : `Demarrage impossible : ${e.code ?? e.message}`);
  process.exit(1);
});

serveur.listen(PORT, () => console.log(`carnet-visites → http://localhost:${PORT}`));
