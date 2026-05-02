import * as cheerio
from "cheerio";

import { getBrowser }
from "../browser.js";

export async function getRegistrationInspection(
  id
) {

  try {

    const browser =
      await getBrowser();

    const page =
      await browser.newPage();

    await page.goto(
      `https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${id}`,
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

    const tables = [];

    $("table")
      .each((i, table) => {

        tables.push(
          $(table).text()
        );
      });

    return { tables };

  } catch (err) {

    console.log(
      `REGISTRATION FAILED ${id}`
    );

    return null;
  }
}