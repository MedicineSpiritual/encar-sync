const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function syncCars() {

  try {

    console.log("START SYNC");

    const inventory = await axios.get(
      "https://api.encar.com/search/car/list/general",
      {
        params: {
          count: true,
          q: "(And.Hidden.N.)",
          sr: "|ModifiedDate|0|50"
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

        const vehicle = detail.data;

        const data = {
          id: car.Id,

          title:
            vehicle?.advertisement?.title ||
            car?.Title ||
            "",

          price:
            vehicle?.advertisement?.price ||
            car?.Price ||
            0,

          year:
            vehicle?.category?.year ||
            car?.Year ||
            null,

          mileage:
            vehicle?.spec?.mileage ||
            car?.Mileage ||
            0,

          fuel:
            vehicle?.spec?.fuelType ||
            car?.FuelType ||
            "",

          transmission:
            vehicle?.spec?.transmission ||
            car?.Transmission ||
            "",

          thumbnail:
            vehicle?.photos?.[0]?.url ||
            car?.Photo ||
            null,

          images:
            vehicle?.photos ||
            [],

          raw_data: vehicle,

          updated_at: new Date()
        };

        console.log("INSERTING:", data);

        const { error } = await supabase
          .from("cars")
          .upsert(data);

        if (error) {
          console.log("SUPABASE ERROR:", error);
        } else {
          console.log("SUCCESS:", car.Id);
        }

      } catch (err) {

        console.log("DETAIL ERROR:", err.message);

      }
    }

    console.log("SYNC DONE");

  } catch (err) {

    console.log("MAIN ERROR:", err.message);

  }
}

cron.schedule("*/15 * * * *", syncCars);

syncCars();