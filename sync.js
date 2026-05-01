const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function syncCars() {
  try {

    console.log("START SYNC...");

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

    const cars = inventory.data.SearchResults;

    console.log("Cars found:", cars.length);

    for (const car of cars) {

      try {

        const detail = await axios.get(
          `https://api.encar.com/v1/readside/clean-encar/vehicle/${car.Id}`
        );

        const vehicle = detail.data;

        const { error } = await supabase
          .from("cars")
          .upsert({
            id: car.Id,
            title: vehicle.advertisement?.title || "",
            price: vehicle.advertisement?.price || 0,
            year: vehicle.category?.year || null,
            mileage: vehicle.spec?.mileage || 0,
            fuel: vehicle.spec?.fuelType || "",
            transmission: vehicle.spec?.transmission || "",
            thumbnail:
              vehicle.photos?.[0]?.url || null,
            images:
              vehicle.photos || [],
            raw_data: vehicle,
            updated_at: new Date()
          });

        if (error) {
          console.log("SUPABASE ERROR:", error);
        } else {
          console.log("Inserted:", car.Id);
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