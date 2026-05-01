const axios = require("axios");

const cheerio = require("cheerio");

async function getInspectionData(carId) {

  try {

    const url =
      `https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${carId}`;

    const res =
      await axios.get(url);

    const $ =
      cheerio.load(res.data);

    const text =
      $("body").text();

    const inspection = {

      accident_history: "",

      owner_count: null,

      inspection_score: "",

      insurance_history: "",

      engine_status: "",

      transmission_status: "",

      leak_status: "",

      body_condition: ""
    };

    if (
      text.includes("무사고")
    ) {

      inspection.accident_history =
        "Pa aksidente";
    }

    else if (
      text.includes("사고")
    ) {

      inspection.accident_history =
        "Me aksidente";
    }

    const ownerMatch =
      text.match(
        /소유자변경\s*(\d+)/
      );

    if (ownerMatch) {

      inspection.owner_count =
        Number(ownerMatch[1]);
    }

    if (
      text.includes(
        "엔진 상태 양호"
      )
    ) {

      inspection.engine_status =
        "Motor në gjendje të mirë";
    }

    if (
      text.includes(
        "미션 상태 양호"
      )
    ) {

      inspection.transmission_status =
        "Kambio në gjendje të mirë";
    }

    if (
      text.includes(
        "누유 없음"
      )
    ) {

      inspection.leak_status =
        "Pa rrjedhje";
    }

    if (
      text.includes("판금")
    ) {

      inspection.body_condition =
        "Ka riparime";
    }

    else {

      inspection.body_condition =
        "Karroceri e mirë";
    }

    return inspection;

  } catch (err) {

    console.log(
      "INSPECTION ERROR:",
      carId
    );

    return null;
  }
}

module.exports = {
  getInspectionData
};