require("dotenv").config();

const axios = require("axios");
const cron = require("node-cron");
const cheerio = require("cheerio");

const {
  createClient
} = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EUR_RATE = 0.00067;
const TRANSPORT_FEE = 1500;

function createSlug(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function translateFuel(fuel) {

  const map = {

    gasoline: "Benzinë",
    petrol: "Benzinë",
    diesel: "Dizel",
    hybrid: "Hibrid",
    electric: "Elektrik",
    lpg: "Gaz"

  };

  return map[
    String(fuel || "")
      .toLowerCase()
  ] || fuel || "";
}

function translateTransmission(t) {

  const map = {

    automatic: "Automatik",
    manual: "Manual",
    cvt: "CVT",
    semiautomatic: "Gjysmë-automatik"

  };

  return map[
    String(t || "")
      .toLowerCase()
  ] || t || "";
}

function buildTitle(car) {

  return `
    ${car.Manufacturer || ""}
    ${car.Model || ""}
    ${car.Badge || ""}
  `
    .replace(/\s+/g, " ")
    .trim();
}

async function getInspectionData(carId) {

  try {

    const url =
      `https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${carId}`;

    const res =
      await axios.get(url);

    const html = res.data;

    const $ = cheerio.load(html);

    const text =
      $("body").text();

    const inspection = {

      accident_history: "",

      owner_count: null,

      inspection_score: "",

      insurance_history: "",

      dealer_comment: "",

      engine_status: "",

      transmission_status: "",

      leak_status: "",

      body_condition: ""
    };

    // ACCIDENT
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

    // OWNER COUNT
    const ownerMatch =
      text.match(/소유자변경\s*(\d+)/);

    if (ownerMatch) {

      inspection.owner_count =
        Number(ownerMatch[1]);
    }

    // ENGINE
    if (
      text.includes("엔진 상태 양호")
    ) {

      inspection.engine_status =
        "Motor në gjendje të mirë";
    }

    // TRANSMISSION
    if (
      text.includes("미션 상태 양호")
    ) {

      inspection.transmission_status =
        "Kambio në gjendje të mirë";
    }

    // LEAK
    if (
      text.includes("누유 없음")
    ) {

      inspection.leak_status =
        "Pa rrjedhje";
    }

    // BODY
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

    // INSURANCE
    if (
      text.includes("보험")
    ) {

      inspection.insurance_history =
        "Ka histori sigurimi";
    }

    // SCORE
    if (
      text.includes("양호")
    ) {

      inspection.inspection_score =
        "Gjendje e mirë";
    }

    return inspection;

  } catch (err) {

    console.log(
      "INSPECTION ERROR:",
      carId,
      err.message
    );

    return null;
  }
}

async function syncCars() {

  try {

    console.log("SYNC START");

    let offset = 0;

    const pageSize = 50;

    let allCars = [];

    while (true) {

      const inventory =
        await axios.get(
          "https://api.encar.com/search/car/list/general",
          {
            params: {
              count: true,
              q: "(And.Hidden.N.)",
              sr: `|ModifiedDate|${offset}|${pageSize}`
            }
          }
        );

      const cars =
        inventory.data
          ?.SearchResults || [];

      if (!cars.length)
        break;

      allCars =
        allCars.concat(cars);

      console.log(
        "TOTAL LOADED:",
        allCars.length
      );

      offset += pageSize;

      // LIMIT
      if (offset >= 1000)
        break;
    }

    const currentIds = [];

    for (const car of allCars) {

      try {

        const id =
          Number(car.Id);

        currentIds.push(id);

        console.log(
          "SYNC:",
          id
        );

        const detailRes =
          await axios.get(
            `https://api.encar.com/v1/readside/vehicle/${id}`,
            {
              params: {
                include:
                  "ADVERTISEMENT,CATEGORY,CONDITION,CONTACT,MANAGE,OPTIONS,PHOTOS,SPEC,PARTNERSHIP,CENTER,VIEW"
              }
            }
          );

        const detail =
          detailRes.data || {};

        // INSPECTION
        const inspection =
          await getInspectionData(
            id
          );

        const title =
          buildTitle(car);

        // PRICE
        const rawPrice =
          car.Price ||
          detail?.advertisement
            ?.price ||
          0;

        const priceKrw =
          Number(
            String(rawPrice)
              .replace(/,/g, "")
          );

        const priceEur =
          Math.round(
            priceKrw *
            EUR_RATE
          );

        const totalPrice =
          priceEur +
          TRANSPORT_FEE;

        // PHOTOS
        let images = [];

        const photoSources = [

          ...(car.Photos || []),

          ...(detail?.photos || []),

          ...(detail
            ?.vehiclePhotos || []),

          ...(detail
            ?.advertisement
            ?.photos || [])
        ];

        for (const p of photoSources) {

          if (p?.path) {

            images.push(
              `https://ci.encar.com${p.path}`
            );
          }

          else if (p?.url) {

            images.push(
              p.url
            );
          }
        }

        // UNIQUE
        images = [
          ...new Set(images)
        ];

        const thumbnail =
          images[0] || null;

        const fuel =
          car.FuelType ||
          detail?.spec
            ?.fuelType ||
          "";

        const transmission =
          car.Transmission ||
          detail?.spec
            ?.transmission ||
          "";

        const payload = {

          id,

          slug:
            createSlug(title),

          title,

          title_sq:
            title
              .replace(
                "Gasoline",
                "Benzinë"
              )
              .replace(
                "Diesel",
                "Dizel"
              )
              .replace(
                "Automatic",
                "Automatik"
              ),

          description:
            `${title} imported from Korea.`,

          description_sq:
            `${title} e importuar nga Korea me doganim dhe transport deri në Durrës.`,

          brand:
            car.Manufacturer ||
            null,

          model:
            car.Model ||
            null,

          badge:
            car.Badge ||
            null,

          year:
            Number(
              car.Year ||
              detail
                ?.category
                ?.year
            ) || null,

          month:
            Number(
              detail
                ?.category
                ?.month
            ) || null,

          mileage:
            Number(
              car.Mileage ||
              detail
                ?.spec
                ?.mileage
            ) || 0,

          fuel:
            translateFuel(
              fuel
            ),

          transmission:
            translateTransmission(
              transmission
            ),

          drivetrain:
            detail?.spec
              ?.driveType ||
            null,

          engine:
            detail?.spec
              ?.engineDisplacement ||
            null,

          exterior_color:
            detail?.spec
              ?.bodyColor ||
            null,

          interior_color:
            detail?.spec
              ?.seatColor ||
            null,

          price_krw:
            priceKrw,

          price_eur:
            priceEur,

          transport_fee_eur:
            TRANSPORT_FEE,

          total_price_eur:
            totalPrice,

          thumbnail,

          images,

          seller_name:
            car.DealerName ||
            null,

          seller_phone:
            detail?.contact
              ?.cellPhone ||
            null,

          car_no:
            detail?.manage
              ?.carNo ||
            null,

          vin:
            detail?.spec
              ?.vin ||
            null,

          options:
            detail?.options ||
            [],

          views:
            detail?.view
              ?.count || 0,

          inspection,

          accident_history:
            inspection
              ?.accident_history ||
            null,

          owner_count:
            inspection
              ?.owner_count ||
            null,

          inspection_score:
            inspection
              ?.inspection_score ||
            null,

          insurance_history:
            inspection
              ?.insurance_history ||
            null,

          dealer_comment:
            inspection
              ?.dealer_comment ||
            null,

          sold: false,

          raw_data: {

            search: car,

            detail,

            inspection
          },

          updated_at:
            new Date()
              .toISOString(),

          last_seen_at:
            new Date()
              .toISOString()
        };

        const { error } =
          await supabase
            .from("cars")
            .upsert(payload);

        if (error) {

          console.log(
            "SUPABASE ERROR:",
            error
          );

        } else {

          console.log(
            "SAVED:",
            id,
            images.length,
            "photos"
          );
        }

      } catch (err) {

        console.log(
          "CAR ERROR:",
          car.Id,
          err.message
        );
      }
    }

    // SOLD DETECTION
    const {
      data: existingCars
    } = await supabase
      .from("cars")
      .select("id");

    const soldIds =
      (existingCars || [])
        .filter(
          x =>
            !currentIds.includes(
              Number(x.id)
            )
        )
        .map(
          x =>
            Number(x.id)
        );

    if (soldIds.length) {

      await supabase
        .from("cars")
        .update({
          sold: true
        })
        .in(
          "id",
          soldIds
        );

      console.log(
        "SOLD:",
        soldIds.length
      );
    }

    console.log(
      "SYNC DONE"
    );

  } catch (err) {

    console.log(
      "MAIN ERROR:",
      err.message
    );
  }
}

cron.schedule(
  "*/15 * * * *",
  syncCars
);

syncCars();