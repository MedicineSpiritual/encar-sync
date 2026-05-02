import { fetchRetry } from "../utils/fetch.js";
import { CONFIG } from "../config.js";
import { filterCars } from "../utils/filter.js";

export async function searchCars() {

  const response = await fetchRetry(
    CONFIG.ENCAR_SEARCH
  );

  const cars =
    response.data?.SearchResults || [];

  return filterCars(cars);
}
