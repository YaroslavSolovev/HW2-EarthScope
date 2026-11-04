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
  const data = await j(B + "/categories", signal);
  if (!Array.isArray(data?.categories))
    throw Error("Invalid NASA categories response");
  return normalizeEonetCategories(data);
}
export async function fetchEonetEvents({ signal } = {}) {
  const data = await j(B + "/events?status=all&days=7", signal);
  if (!Array.isArray(data?.events)) throw Error("Invalid NASA events response");
  return normalizeEonetResponse(data);
}
