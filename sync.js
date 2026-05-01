const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function translateFuel(fuel) {

  const map = {
    gasoline: "Benzinë",
    diesel: "Dizel",
    hybrid: "Hibrid",
    electric: "Elektrike",
    lpg: "Gas",
  };

  return map[String(fuel).toLowerCase()] || fuel;
}

function translateTransmission(transmission) {

  const map = {
    automatic: "Automatik",
    manual: "Manual",
    cvt: "CVT",
  };

  return map[String(transmission).toLowerCase()] || transmission;
}

async function syncCars() {

  try {

    console.log("START SYNC");

    const inventory = await axios.get(
      "https://api.encar.com/search/car/list/general",
      {
        params: {
          count: true,
          q: "(And.Hidden.N.)",
          sr: "|ModifiedDate|0|100"
        }
      }
    );

    const cars = inventory.data.SearchResults || [];

    console.log("FOUND:", cars.length);

    for (const car of cars) {

      try {

        const detail = await axios.get(
          `https://api.encar.com/v1/readside/clean-encar/vehicle/${car.Id}`
        );

        const vehicle = detail.data || {};

        const title =
          vehicle?.advertisement?.title ||
          vehicle?.title ||
          car?.Title ||
          "Pa titull";

        const price =
          vehicle?.advertisement?.price ||
          vehicle?.price ||
          car?.Price ||
          0;

        const year =
          vehicle?.category?.year ||
          vehicle?.year ||
          car?.Year ||
          null;

        const mileage =
          vehicle?.spec?.mileage ||
          vehicle?.mileage ||
          car?.Mileage ||
          0;

        const fuel =
          vehicle?.spec?.fuelType ||
          vehicle?.fuelType ||
          car?.FuelType ||
          "";

        const transmission =
          vehicle?.spec?.transmission ||
          vehicle?.transmission ||
          car?.Transmission ||
          "";

        const photos =
          vehicle?.photos ||
          vehicle?.images ||
          [];

        const thumbnail =
          photos?.[0]?.url ||
          photos?.[0] ||
          null;

        const data = {
          id: car.Id,

          title,

          price,

          year,

          mileage,

          fuel: translateFuel(fuel),

          transmission:
            translateTransmission(transmission),

          thumbnail,

          images: photos,

          raw_data: vehicle,

          updated_at: new Date()
        };

        console.log("INSERT:", title);

        const { error } = await supabase
          .from("cars")
          .upsert(data);

        if (error) {
          console.log("SUPABASE ERROR:", error);
        }

      } catch (err) {

        console.log(
          "DETAIL ERROR:",
          car.Id,
          err.message
        );
      }
    }

    console.log("SYNC DONE");

  } catch (err) {

    console.log("MAIN ERROR:", err.message);

  }
}

cron.schedule("*/15 * * * *", syncCars);

syncCars();