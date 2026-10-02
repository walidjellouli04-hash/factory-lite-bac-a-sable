// Stockage en mémoire du carnet de visites.
// Immuable : chaque opération rend un nouvel état, jamais de mutation en place.

export const emptyState = () => ({ visites: [], nextId: 1 });

export const listVisites = (state) => [...state.visites];

export const getVisite = (state, id) => state.visites.find((v) => v.id === id) ?? null;

export const addVisite = (state, data) => {
  const visite = { id: state.nextId, ...data };
  return {
    state: { visites: [...state.visites, visite], nextId: state.nextId + 1 },
    visite,
  };
};

export const removeVisite = (state, id) => {
  const existe = state.visites.some((v) => v.id === id);
  return {
    state: existe ? { ...state, visites: state.visites.filter((v) => v.id !== id) } : state,
    supprimee: existe,
  };
};
