require("dotenv").config();

const axios = require("axios");
const cron = require("node-cron");
const cheerio = require("cheerio");
const pLimit = require("p-limit");

const {
  createClient
} = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const limit = pLimit(3);

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
    cvt: "CVT"

  };

  return map[
    String(t || "")
      .toLowerCase()
  ] || t || "";
}

async function getInspection(id) {

  try {

    const url =
      `https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${id}`;

    const res = await axios.get(url);

    const $ = cheerio.load(res.data);

    const text = $("body").text();

    return {

      accident_history:
        text.includes("무사고")
          ? "Pa aksidente"
          : "Me aksidente",

      inspection_score:
        text.includes("양호")
          ? "Gjendje e mirë"
          : null
    };

  } catch {

    return {};
  }
}

async function processCar(car) {

  try {

    const id = Number(car.Id);

    console.log("SYNC:", id);

    const detailRes = await axios.get(
      `https://api.encar.com/v1/readside/vehicle/${id}`,
      {
        params: {
          include:
            "ADVERTISEMENT,CATEGORY,OPTIONS,PHOTOS,SPEC,CONTACT,MANAGE"
        }
      }
    );

    const detail = detailRes.data || {};

    const inspection =
      await getInspection(id);

    const title = `
      ${car.Manufacturer || ""}
      ${car.Model || ""}
      ${car.Badge || ""}
    `
      .replace(/\s+/g, " ")
      .trim();

    // PRICE FIX
    let rawPrice =
      car.Price ||
      detail?.advertisement?.price ||
      0;

    rawPrice =
      Number(
        String(rawPrice)
          .replace(/,/g, "")
      );

    // ENCAR issue fix
    if (rawPrice < 1000000) {
      rawPrice =
        rawPrice * 10000;
    }

    const priceEur =
      Math.round(
        rawPrice * EUR_RATE
      );

    const totalPrice =
      priceEur +
      TRANSPORT_FEE;

    // PHOTOS
    let images = [];

    const photoArrays = [

      ...(car.Photos || []),

      ...(detail?.photos || []),

      ...(detail?.advertisement?.photos || [])

    ];

    for (const p of photoArrays) {

      if (p?.path) {

        images.push(
          `https://ci.encar.com${p.path}`
        );
      }

      else if (p?.url) {

        images.push(p.url);
      }
    }

    images = [
      ...new Set(images)
    ];

    // LIMIT 20+
    images = images.slice(0, 30);

    const payload = {

      id,

      slug:
        createSlug(title),

      title,

      title_sq: title,

      description:
        `${title} imported from Korea.`,

      description_sq:
        `${title} e importuar nga Korea.`,

      brand:
        car.Manufacturer || null,

      model:
        car.Model || null,

      badge:
        car.Badge || null,

      year:
        Number(car.Year) || null,

      mileage:
        Number(car.Mileage) || 0,

      fuel:
        translateFuel(
          car.FuelType
        ),

      transmission:
        translateTransmission(
          car.Transmission
        ),

      drivetrain:
        detail?.spec?.driveType ||
        null,

      engine:
        detail?.spec?.engineDisplacement ||
        null,

      exterior_color:
        detail?.spec?.bodyColor ||
        null,

      interior_color:
        detail?.spec?.seatColor ||
        null,

      price_krw:
        rawPrice,

      price_eur:
        priceEur,

      transport_fee_eur:
        TRANSPORT_FEE,

      total_price_eur:
        totalPrice,

      thumbnail:
        images[0] || null,

      images,

      seller_name:
        car.DealerName || null,

      seller_phone:
        detail?.contact?.cellPhone ||
        null,

      car_no:
        detail?.manage?.carNo ||
        null,

      vin:
        detail?.spec?.vin ||
        null,

      options:
        detail?.options || [],

      inspection,

      accident_history:
        inspection?.accident_history,

      inspection_score:
        inspection?.inspection_score,

      sold: false,

      raw_data: {
        search: car,
        detail
      },

      updated_at:
        new Date().toISOString(),

      last_seen_at:
        new Date().toISOString()
    };

    const { error } =
      await supabase
        .from("cars")
        .upsert(payload);

    if (error) {

      console.log(
        "SUPABASE ERROR:",
        error.message
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
      err.message
    );
  }
}

async function syncCars() {

  try {

    console.log("SYNC START");

    let offset = 0;

    const pageSize = 50;

    let allCars = [];

    while (true) {

      const res = await axios.get(
        "https://api.encar.com/search/car/list/general",
        {
          params: {
            count: true,
            q: "(And.Hidden.N.)",
            sr:
              `|ModifiedDate|${offset}|${pageSize}`
          }
        }
      );

      const cars =
        res.data?.SearchResults || [];

      if (!cars.length)
        break;

      allCars =
        allCars.concat(cars);

      console.log(
        "TOTAL:",
        allCars.length
      );

      offset += pageSize;

      // SAFE LIMIT
      if (offset >= 300)
        break;
    }

    await Promise.all(

      allCars.map(car =>
        limit(() =>
          processCar(car)
        )
      )
    );

    console.log("SYNC DONE");

  } catch (err) {

    console.log(
      "MAIN ERROR:",
      err.message
    );
  }
}

cron.schedule(
  "*/30 * * * *",
  syncCars
);

syncCars();