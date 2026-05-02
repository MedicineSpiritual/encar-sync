import axios from "axios";

export async function searchImportedCars() {

  const url =
    "https://api.encar.com/search/car/list/general";

  const response = await axios.get(url, {
    params: {
      count: "true",
      q: "(And.Hidden.N._.CarType.N.)",
      sr: "|ModifiedDate|0|50"
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0",
      "Accept":
        "application/json",
      "Referer":
        "https://www.encar.com/",
      "Origin":
        "https://www.encar.com"
    }
  });

  const data = response.data;

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
          Id: obj.Id,
          Year: obj.Year
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