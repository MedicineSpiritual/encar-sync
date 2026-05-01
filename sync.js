require("dotenv").config();

const axios = require("axios");
const cron = require("node-cron");

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

function trFuel(fuel) {

  const map = {
    gasoline: "Benzinë",
    petrol: "Benzinë",
    diesel: "Dizel",
    hybrid: "Hibrid",
    electric: "Elektrik",
    lpg: "Gaz"
  };

  return map[
    String(fuel || "").toLowerCase()
  ] || fuel;
}

function trTransmission(t) {

  const map = {
    automatic: "Automatik",
    manual: "Manual",
    cvt: "CVT"
  };

  return map[
    String(t || "").toLowerCase()
  ] || t;
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
            sr: `|ModifiedDate|${offset}|${pageSize}`
          }
        }
      );

      const cars =
        res.data?.SearchResults || [];

      if (!cars.length) break;

      allCars =
        allCars.concat(cars);

      console.log(
        "TOTAL:",
        allCars.length
      );

      offset += pageSize;

      if (offset >= 1000) break;
    }

    const currentIds = [];

    for (const car of allCars) {

      try {

        const id = Number(car.Id);

        currentIds.push(id);

        console.log("SYNC:", id);

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

        const title =
          buildTitle(car);

        const rawPrice =
          car.Price ||
          detail?.advertisement?.price ||
          0;

        const priceKrw =
          Number(
            String(rawPrice)
              .replace(/,/g, "")
          );

        const priceEur =
          Math.round(
            priceKrw * EUR_RATE
          );

        const totalPrice =
          priceEur +
          TRANSPORT_FEE;

        let images = [];

        if (
          Array.isArray(car.Photos)
        ) {

          for (const p of car.Photos) {

            if (p?.path) {
              images.push(
                `https://ci.encar.com${p.path}`
              );
            }

            if (p?.url) {
              images.push(p.url);
            }
          }
        }

        if (
          Array.isArray(detail?.photos)
        ) {

          for (const p of detail.photos) {

            if (p?.path) {
              images.push(
                `https://ci.encar.com${p.path}`
              );
            }

            if (p?.url) {
              images.push(p.url);
            }
          }
        }

        images = [
          ...new Set(images)
        ];

        const payload = {

          id,

          slug:
            createSlug(title),

          title,

          title_sq:
            title
              .replace("Gasoline", "Benzinë")
              .replace("Diesel", "Dizel")
              .replace("Automatic", "Automatik"),

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
            Number(
              car.Year ||
              detail?.category?.year
            ) || null,

          month:
            Number(
              detail?.category?.month
            ) || null,

          mileage:
            Number(
              car.Mileage ||
              detail?.spec?.mileage
            ) || 0,

          fuel:
            trFuel(
              car.FuelType ||
              detail?.spec?.fuelType
            ),

          transmission:
            trTransmission(
              car.Transmission ||
              detail?.spec?.transmission
            ),

          drivetrain:
            detail?.spec?.driveType || null,

          engine:
            detail?.spec?.engineDisplacement || null,

          exterior_color:
            detail?.spec?.bodyColor || null,

          interior_color:
            detail?.spec?.seatColor || null,

          price_krw:
            priceKrw,

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
            detail?.contact?.cellPhone || null,

          car_no:
            detail?.manage?.carNo || null,

          vin:
            detail?.spec?.vin || null,

          options:
            detail?.options || [],

          views:
            detail?.view?.count || 0,

          sold: false,

          raw_data: detail,

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

          console.log(error);

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

    const {
      data: existingCars
    } = await supabase
      .from("cars")
      .select("id");

    const soldIds =
      existingCars
        .filter(
          x =>
            !currentIds.includes(
              Number(x.id)
            )
        )
        .map(x => x.id);

    if (soldIds.length) {

      await supabase
        .from("cars")
        .update({
          sold: true
        })
        .in("id", soldIds);

      console.log(
        "SOLD:",
        soldIds.length
      );
    }

    console.log("SYNC DONE");

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