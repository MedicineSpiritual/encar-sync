import { fetchRetry } from "../utils/fetch.js";
import { filterCars } from "../utils/filter.js";

export async function searchCars() {

  const url =
    "https://api.encar.com/search/car/list/general";

  const params = {
    count: 50,
    q: "(And.Hidden.N._.CarType.Y.)",
    sr: "|ModifiedDate|0|20"
  };

  const response =
    await fetchRetry(url, {
      params
    });

  const cars =
    response.data?.SearchResults || [];

  return filterCars(cars);
}