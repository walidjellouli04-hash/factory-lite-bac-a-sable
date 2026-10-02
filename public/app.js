// Front du carnet de visites. Vanilla, pas de build.

const $ = (sel) => document.querySelector(sel);
const LIBELLE_STATUT = { planifiee: "Planifiée", realisee: "Réalisée", annulee: "Annulée" };

const formaterDate = (iso) => {
  const [a, m, j] = String(iso).split("-");
  return a && m && j ? `${j}/${m}/${a}` : iso;
};

// Le compte rendu est injecté sans échappement : son HTML est garanti par la
// liste blanche de src/validate.js (normaliserCompteRendu). Les autres champs restent échappés.
function ligne(visite) {
  const li = document.createElement("li");
  li.className = "visite";
  li.innerHTML = `
    <div class="visite-tete">
      <strong>${escape(visite.client)}</strong>
      <span class="badge badge-${visite.statut}">${LIBELLE_STATUT[visite.statut] ?? visite.statut}</span>
    </div>
    <div class="visite-meta">${escape(visite.ville)} · ${formaterDate(visite.date)}</div>
    ${visite.compteRendu ? `<p class="visite-cr">${visite.compteRendu}</p>` : ""}
    <button class="supprimer" data-id="${visite.id}" aria-label="Supprimer">Supprimer</button>`;
  return li;
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function charger() {
  const rep = await fetch("/api/visites");
  if (!rep.ok) return afficherErreurs(["Impossible de charger les visites."]);
  const { visites } = await rep.json();
  const liste = $("#liste");
  liste.replaceChildren(...visites.map(ligne));
  $("#compteur").textContent = visites.length;
}

function afficherErreurs(messages) {
  const bloc = $("#erreurs");
  bloc.hidden = messages.length === 0;
  bloc.textContent = messages.join(" · ");
}

// Copie locale de COULEURS_CR (src/validate.js) : le front ne peut pas importer src/.
const COULEURS_CR = ["rouge", "bleu", "vert", "orange"];

function envelopper(element) {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed || !$("#editeur-cr").contains(range.commonAncestorContainer)) return;
  element.appendChild(range.extractContents());
  range.insertNode(element);
}

function serialiser(noeud, premier = false) {
  if (noeud.nodeType === Node.TEXT_NODE) return escape(noeud.nodeValue);
  if (noeud.nodeType !== Node.ELEMENT_NODE) return "";
  const enfants = () => Array.from(noeud.childNodes).map((n) => serialiser(n)).join("");
  switch (noeud.tagName) {
    case "BR": return "<br>";
    case "U": return `<u>${enfants()}</u>`;
    case "SPAN":
      return COULEURS_CR.includes(noeud.dataset.couleur)
        ? `<span class="cr-${noeud.dataset.couleur}">${enfants()}</span>`
        : enfants();
    case "DIV":
    case "P": return (premier ? "" : "<br>") + enfants();
    default: return enfants();
  }
}

const serialiserEditeur = () =>
  Array.from($("#editeur-cr").childNodes).map((n, i) => serialiser(n, i === 0)).join("");

$(".barre-cr").addEventListener("mousedown", (e) => e.preventDefault());
$(".barre-cr").addEventListener("click", (e) => {
  const bouton = e.target.closest("button");
  if (!bouton) return;
  if (bouton.dataset.action === "souligner") return envelopper(document.createElement("u"));
  const couleur = bouton.dataset.couleur;
  if (!COULEURS_CR.includes(couleur)) return;
  const span = document.createElement("span");
  span.className = "cr-" + couleur;
  span.dataset.couleur = couleur;
  envelopper(span);
});

$("#formulaire").addEventListener("submit", async (e) => {
  e.preventDefault();
  afficherErreurs([]);
  e.target.elements.compteRendu.value = serialiserEditeur();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const rep = await fetch("/api/visites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (rep.status === 201) {
    e.target.reset();
    $("#editeur-cr").replaceChildren();
    return charger();
  }
  const corps = await rep.json().catch(() => ({}));
  afficherErreurs(corps.details ?? ["Enregistrement refusé."]);
});

$("#liste").addEventListener("click", async (e) => {
  const bouton = e.target.closest(".supprimer");
  if (!bouton) return;
  await fetch(`/api/visites/${bouton.dataset.id}`, { method: "DELETE" });
  charger();
});

charger();
