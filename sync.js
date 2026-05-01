const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function syncCars() {

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

  const currentIds = [];

  for (const car of cars) {

    currentIds.push(car.Id);

    const detail = await axios.get(
      `https://api.encar.com/v1/readside/clean-encar/vehicle/${car.Id}`
    );

    const vehicle = detail.data;

    await supabase
      .from("cars")
      .upsert({
        id: car.Id,
        title: vehicle.advertisement?.title,
        price: vehicle.advertisement?.price,
        year: vehicle.category?.year,
        mileage: vehicle.spec?.mileage,
        fuel: vehicle.spec?.fuelType,
        transmission: vehicle.spec?.transmission,
        raw_data: vehicle,
        updated_at: new Date()
      });
  }

  const { data: existingCars } =
    await supabase.from("cars").select("id");

  const soldIds = existingCars
    .filter(x => !currentIds.includes(x.id))
    .map(x => x.id);

  if (soldIds.length > 0) {
    await supabase
      .from("cars")
      .delete()
      .in("id", soldIds);
  }

  console.log("SYNC DONE");
}

cron.schedule("*/15 * * * *", syncCars);

syncCars();