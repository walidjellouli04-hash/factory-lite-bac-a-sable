// Resolution du fichier a servir pour une URL. Fonction pure : le serveur ne
// fait que l'appeler, et elle se teste sans ouvrir de port.

/**
 * Rend le chemin relatif du fichier demande, ou null si l'URL est refusee.
 * La chaine de requete est retiree AVANT toute decision : `/?t=123` demande la
 * racine, pas un fichier nomme « ?t=123 ».
 */
export function cheminDemande(url) {
  const sansRequete = String(url ?? "/").split("?")[0].split("#")[0];
  if (sansRequete === "" || sansRequete === "/") return "index.html";

  let decode;
  try { decode = decodeURIComponent(sansRequete.slice(1)); }
  catch { return null; }                       // sequence d'echappement invalide

  if (decode.includes("\0")) return null;
  // Remontee d'arborescence : refusee ici, et le serveur revalide ensuite.
  if (decode.split(/[\\/]/).includes("..")) return null;
  return decode;
}
