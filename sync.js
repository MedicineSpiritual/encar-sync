const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

// SUPABASE CONNECTION
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncCars() {
  try {
    console.log("STARTING SYNC...");

    // GET CAR LIST
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

    console.log(`FOUND ${cars.length} CARS`);

    const currentIds = [];

    for (const car of cars) {
      try {
        currentIds.push(car.Id);

        // GET CAR DETAILS
        const detail = await axios.get(
          `https://api.encar.com/v1/readside/clean-encar/vehicle/${car.Id}`
        );

        const vehicle = detail.data;

        const carData = {
          id: car.Id,
          title: vehicle.advertisement?.title || "",
          price: vehicle.advertisement?.price || 0,
          year: vehicle.category?.year || null,
          mileage: vehicle.spec?.mileage || 0,
          fuel: vehicle.spec?.fuelType || "",
          transmission: vehicle.spec?.transmission || "",
          thumbnail:
            vehicle.photos?.[0]?.url ||
            vehicle.photo?.url ||
            "",

          images: vehicle.photos || [],

          raw_data: vehicle,

          updated_at: new Date()
        };

        // INSERT / UPDATE
        const { error } = await supabase
          .from("cars")
          .upsert(carData);

        if (error) {
          console.log("SUPABASE ERROR:");
          console.log(error);
        } else {
          console.log(`INSERTED CAR ${car.Id}`);
        }

      } catch (err) {
        console.log(`ERROR WITH CAR ${car.Id}`);
        console.log(err.message);
      }
    }

    // DELETE SOLD CARS
    const { data: existingCars, error: fetchError } =
      await supabase
        .from("cars")
        .select("id");

    if (fetchError) {
      console.log(fetchError);
    }

    const soldIds = existingCars
      ?.filter(x => !currentIds.includes(x.id))
      .map(x => x.id);

    if (soldIds?.length > 0) {
      await supabase
        .from("cars")
        .delete()
        .in("id", soldIds);

      console.log(`DELETED ${soldIds.length} SOLD CARS`);
    }

    console.log("SYNC DONE");

  } catch (error) {
    console.log("MAIN ERROR:");
    console.log(error.message);
  }
}

// RUN EVERY 15 MINUTES
cron.schedule("*/15 * * * *", syncCars);

// RUN NOW
syncCars();