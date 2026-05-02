import * as cheerio from "cheerio";
import { fetchRetry } from "../utils/fetch.js";

export async function scrapeInspection(id) {

  const url =
    `https://fem.encar.com/cars/report/inspect/${id}`;

  const response =
    await fetchRetry(url);

  const $ = cheerio.load(response.data);

  return {
    inspection_score:
      $(".score")
        .first()
        .text()
        .trim(),

    body_status:
      $(".body-status")
        .text()
        .trim(),

    engine_status:
      $(".engine-status")
        .text()
        .trim(),

    transmission_status:
      $(".mission-status")
        .text()
        .trim()
  };
}
