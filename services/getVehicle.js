import { fetchRetry } from "../utils/fetch.js";
import { CONFIG } from "../config.js";

export async function getVehicle(id) {

  const response = await fetchRetry(
    `${CONFIG.ENCAR_DETAIL}/${id}`
  );

  return response.data;
}
