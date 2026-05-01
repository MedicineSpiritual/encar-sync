const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

    console.log("TOTAL CARS:", cars.length);

    for (const car of cars) {

      try {

        console.log("SYNCING:", car.Id);

        const detail = await axios.get(
          `https://api.encar.com/v1/readside/clean-encar/vehicle/${car.Id}`
        );

        const vehicle = detail.data;

        const carData = {
          id: Number(car.Id),
          title: vehicle?.advertisement?.title || "",
          price: vehicle?.advertisement?.price || 0,
          year: vehicle?.category?.year || null,
          mileage: vehicle?.spec?.mileage || null,
          fuel: vehicle?.spec?.fuelType || "",
          transmission: vehicle?.spec?.transmission || "",
          thumbnail: vehicle?.photos?.[0] || "",
          images: vehicle?.photos || [],
          raw_data: vehicle,
          updated_at: new Date()
        };

        const { error } = await supabase
          .from("cars")
          .upsert(carData);

        if (error) {
          console.log("SUPABASE ERROR:", error);
        } else {
          console.log("INSERTED:", car.Id);
        }

      } catch (err) {
        console.log("CAR ERROR:", car.Id, err.message);
      }

    }

    console.log("SYNC DONE");

  } catch (err) {
    console.log("MAIN ERROR:", err.message);
  }
}

cron.schedule("*/15 * * * *", syncCars);

syncCars();