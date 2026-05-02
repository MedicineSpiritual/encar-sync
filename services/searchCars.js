import axios from "axios";

async function fetchCars(query) {

  const url =
    "https://api.encar.com/search/car/list/general";

  const response =
    await axios.get(url, {

      params: {
        count: "true",
        q: query,
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

  return response.data;
}

function extractCars(data) {

  const results = [];

  function extract(obj) {

    if (!obj) {
      return;
    }

    if (Array.isArray(obj)) {

      obj.forEach(extract);

      return;
    }

    if (typeof obj === "object") {

      if (obj.Id) {

        const yearMonth =
          String(obj.Year || "");

        const year =
          Number(yearMonth.slice(0, 4));

        if (year >= 2016) {

          results.push({
            Id: obj.Id,
            Year: obj.Year
          });
        }
      }

      Object.values(obj)
        .forEach(extract);
    }
  }

  extract(data);

  return results;
}

export async function searchCars() {

  const domesticQuery =
    "(And.Hidden.N._.CarType.Y.)";

  const importedQuery =
    "(And.Hidden.N._.CarType.N.)";

  const domesticData =
    await fetchCars(domesticQuery);

  const importedData =
    await fetchCars(importedQuery);

  const domesticCars =
    extractCars(domesticData);

  const importedCars =
    extractCars(importedData);

  console.log(
    `Domestic cars: ${domesticCars.length}`
  );

  console.log(
    `Imported cars: ${importedCars.length}`
  );

  const combined = [
    ...domesticCars,
    ...importedCars
  ];

  const unique = [
    ...new Map(
      combined.map(car => [car.Id, car])
    ).values()
  ];

  console.log(
    `Filtered cars: ${unique.length}`
  );

  return unique;
}