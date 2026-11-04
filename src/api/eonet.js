import {
  normalizeEonetCategories,
  normalizeEonetResponse,
} from "../utils/normalizeEonet.js";
const B = "https://eonet.gsfc.nasa.gov/api/v3";
async function j(u, s) {
  const r = await fetch(u, { signal: s });
  if (!r.ok) throw Error("NASA EONET request failed (" + r.status + ")");
  return r.json();
}
export async function fetchEonetCategories({ signal } = {}) {
  return normalizeEonetCategories(await j(B + "/categories", signal));
}
export async function fetchEonetEvents({ signal } = {}) {
  return normalizeEonetResponse(
    await j(B + "/events?status=all&days=7", signal),
  );
}
