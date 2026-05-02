import * as cheerio from "cheerio";
import { fetchRetry } from "../utils/fetch.js";

export async function scrapeOptions(id) {

  const url =
    `https://fem.encar.com/cars/option/${id}`;

  const response =
    await fetchRetry(url);

  const $ = cheerio.load(response.data);

  const result = {
    safety: [],
    exterior: [],
    seats: [],
    media: []
  };

  $("h3").each((i, el) => {

    const title =
      $(el).text().trim();

    const items = [];

    $(el)
      .parent()
      .find("span.font-semibold")
      .each((_, item) => {

        items.push(
          $(item).text().trim()
        );
      });

    if (title.includes("Siguri")) {
      result.safety = items;
    }

    if (title.includes("Jashte")) {
      result.exterior = items;
    }

    if (title.includes("Uleset")) {
      result.seats = items;
    }

    if (title.includes("Komoditet")) {
      result.media = items;
    }
  });

  return result;
}
