import axios from "axios";
import * as cheerio from "cheerio";

export async function getInspectionDetail(id) {

  try {

    const url =
      `https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${id}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0"
      }
    });

    const html = response.data;

    const $ = cheerio.load(html);

    const inspectionData = {};

    $("table tr").each((_, el) => {

      const key =
        $(el)
          .find("th")
          .first()
          .text()
          .trim();

      const value =
        $(el)
          .find("td")
          .first()
          .text()
          .trim();

      if (key && value) {
        inspectionData[key] = value;
      }

    });

    return inspectionData;

  } catch (err) {

    console.log(
      `INSPECTION DETAIL FAILED ${id}`
    );

    return {};
  }
}