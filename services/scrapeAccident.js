import * as cheerio from "cheerio";
import { fetchRetry } from "../utils/fetch.js";

export async function scrapeAccident(id) {

  const url =
    `https://fem.encar.com/cars/report/accident/${id}`;

  const response =
    await fetchRetry(url);

  const $ = cheerio.load(response.data);

  return {
    insurance_history:
      $(".insurance")
        .text()
        .trim(),

    accident_history:
      $(".accident")
        .text()
        .trim(),

    replaced_parts:
      $(".replaced")
        .text()
        .trim()
  };
}
