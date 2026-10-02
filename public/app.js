// Front du carnet de visites. Vanilla, pas de build.

const $ = (sel) => document.querySelector(sel);
const LIBELLE_STATUT = { planifiee: "Planifiée", realisee: "Réalisée", annulee: "Annulée" };

const formaterDate = (iso) => {
  const [a, m, j] = String(iso).split("-");
  return a && m && j ? `${j}/${m}/${a}` : iso;
};

function ligne(visite) {
  const li = document.createElement("li");
  li.className = "visite";
  li.innerHTML = `
    <div class="visite-tete">
      <strong>${escape(visite.client)}</strong>
      <span class="badge badge-${visite.statut}">${LIBELLE_STATUT[visite.statut] ?? visite.statut}</span>
    </div>
    <div class="visite-meta">${escape(visite.ville)} · ${formaterDate(visite.date)}</div>
    ${visite.compteRendu ? `<p class="visite-cr">${escape(visite.compteRendu)}</p>` : ""}
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

$("#formulaire").addEventListener("submit", async (e) => {
  e.preventDefault();
  afficherErreurs([]);
  const data = Object.fromEntries(new FormData(e.target).entries());
  const rep = await fetch("/api/visites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (rep.status === 201) { e.target.reset(); return charger(); }
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
