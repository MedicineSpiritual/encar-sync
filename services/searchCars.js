import { fetchRetry } from "../utils/fetch.js";
import { filterCars } from "../utils/filter.js";

export async function searchCars() {

  const url =
    "https://api.encar.com/search/car/list/premium";

  const params = {

    count: 30,

    q:
      "(And.Hidden.N._.CarType.Y.)",

    sr:
      "|ModifiedDate|0|30"
  };

  const response =
    await fetchRetry(url, {
      params
    });

  const cars =
    response.data?.SearchResults || [];

  return filterCars(cars);
}