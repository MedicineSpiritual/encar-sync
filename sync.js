const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function krwToEur(price) {

  if (!price) return null;

  return Math.round(price * 0.00067) + 1500;
}

function createSlug(text) {

  return text
    ?.toLowerCase()
    ?.replace(/[^a-z0-9]+/g, "-")
    ?.replace(/(^-|-$)/g, "");
}

async function syncCars() {

  try {

    console.log("SYNC START");

    let start = 0;

    let allCars = [];

    while (true) {

      const inventory = await axios.get(
        "https://api.encar.com/search/car/list/general",
        {
          params: {
            count: true,
            q: "(And.Hidden.N.)",
            sr: `|ModifiedDate|${start}|50`
          }
        }
      );

      const cars = inventory.data.SearchResults;

      if (!cars || cars.length === 0) break;

      allCars = [...allCars, ...cars];

      console.log(`Loaded ${allCars.length}`);

      start += 50;

      if (start >= 300) break;
    }

    const currentIds = [];

    for (const car of allCars) {

      try {

        currentIds.push(car.Id);

        const detail = await axios.get(
          `https://api.encar.com/v1/readside/clean-encar/vehicle/${car.Id}`
        );

        const vehicle = detail.data;

        console.log(JSON.stringify(vehicle));

        const title =
          vehicle?.advertisement?.title ||
          vehicle?.vehicleName ||
          "No title";

        const images =
          vehicle?.photos?.map(x => x.url) || [];

        const payload = {

          id: car.Id,

          title,
          title_sq: title,

          slug: createSlug(title),

          description:
            `${title} importuar nga Korea.`,

          description_sq:
            `${title} e importuar nga Korea.`,

          brand:
            vehicle?.category?.manufacturer,

          model:
            vehicle?.category?.model,

          year:
            vehicle?.category?.year,

          mileage:
            vehicle?.spec?.mileage,

          fuel:
            vehicle?.spec?.fuelType,

          transmission:
            vehicle?.spec?.transmission,

          drivetrain:
            vehicle?.spec?.driveType,

          engine:
            vehicle?.spec?.engineDisplacement,

          exterior_color:
            vehicle?.spec?.bodyColor,

          interior_color:
            vehicle?.spec?.seatColor,

          price_krw:
            vehicle?.advertisement?.price,

          price_eur:
            krwToEur(
              vehicle?.advertisement?.price
            ),

          thumbnail:
            images[0] || null,

          images,

          vin:
            vehicle?.spec?.vin,

          seller_name:
            vehicle?.seller?.name,

          raw_data: vehicle,

          sold: false,

          updated_at: new Date()
        };

        const { error } = await supabase
          .from("cars")
          .upsert(payload);

        if (error) {

          console.log(error);

        } else {

          console.log(`Saved ${car.Id}`);
        }

      } catch (err) {

        console.log("DETAIL ERROR");

        console.log(err.message);
      }
    }

    const { data: existingCars } =
      await supabase
        .from("cars")
        .select("id");

    const soldIds = existingCars
      .filter(x => !currentIds.includes(x.id))
      .map(x => x.id);

    if (soldIds.length > 0) {

      await supabase
        .from("cars")
        .update({ sold: true })
        .in("id", soldIds);

      console.log(`Sold: ${soldIds.length}`);
    }

    console.log("SYNC DONE");

  } catch (err) {

    console.log(err.message);
  }
}

cron.schedule("*/15 * * * *", syncCars);

syncCars();