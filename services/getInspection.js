import * as cheerio
from "cheerio";

import { getBrowser }
from "../browser.js";

export async function getInspection(
  id
) {

  try {

    const browser =
      await getBrowser();

    const page =
      await browser.newPage();

    await page.goto(
      `https://fem.encar.com/cars/report/inspect/${id}`,
      {
        waitUntil:
          "networkidle",
        timeout: 60000
      }
    );

    await page.waitForTimeout(
      5000
    );

    const html =
      await page.content();

    await page.close();

    const $ =
      cheerio.load(html);

    return {

      text:
        $("body")
          .text()
          .replace(/\s+/g, " ")
          .trim()

    };

  } catch (err) {

    console.log(
      `INSPECTION FAILED ${id}`
    );

    return null;
  }
}