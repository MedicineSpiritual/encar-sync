import * as cheerio from "cheerio";

import { fetchRetry } from "../utils/fetch.js";

export async function searchCars() {

  const response =
    await fetchRetry(
      "https://fem.encar.com/cars"
    );

  const $ =
    cheerio.load(response.data);

  const ids = [];

  $("a").each((_, el) => {

    const href =
      $(el).attr("href");

    if (!href) return;

    const match =
      href.match(/carid=(\d+)/);

    if (!match) return;

    ids.push({
      Id: match[1]
    });
  });

  return [
    ...new Map(
      ids.map(x => [x.Id, x])
    ).values()
  ];
}