import { fetchRetry } from "../utils/fetch.js";

export async function searchCars() {

  const q = encodeURIComponent(
    "(And.Hidden.N._.CarType.Y.)"
  );

  const url =
    `https://api.encar.com/search/car/list/general?count=true&q=${q}&sr=|ModifiedDate|0|50`;

  const response =
    await fetchRetry(url);

  const data =
    response.data;

  const results = [];

  function extract(obj) {

    if (!obj) return;

    if (Array.isArray(obj)) {

      obj.forEach(extract);

      return;
    }

    if (typeof obj === "object") {

      if (obj.Id) {

        results.push({
          Id: obj.Id
        });
      }

      Object.values(obj)
        .forEach(extract);
    }
  }

  extract(data);

  return [
    ...new Map(
      results.map(x => [x.Id, x])
    ).values()
  ];
}