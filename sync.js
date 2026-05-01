const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function krwToEur(priceKrw) {
  if (!priceKrw) return null;

  const eur = Math.round(priceKrw * 0.00067);

  return eur + 1500;
}

async function translateToAlbanian(text) {
  if (!text) return "";

  return text
    .replace(/automatic/gi, "Automatik")
    .replace(/manual/gi, "Manual")
    .replace(/diesel/gi, "Dizel")
    .replace(/gasoline/gi, "Benzinë")
    .replace(/hybrid/gi, "Hibrid")
    .replace(/electric/gi, "Elektrik");
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

      start += 50;

      console.log(`Loaded ${allCars.length} cars`);

      if (start > 300) break;
    }

    const currentIds = [];

    for (const car of allCars) {

      try {

        currentIds.push(car.Id);

        const detail = await axios.get(
          `https://api.encar.com/v1/readside/clean-encar/vehicle/${car.Id}`
        );

        const vehicle = detail.data;

        const title =
          vehicle?.advertisement?.title ||
          vehicle?.vehicleName ||
          "Pa titull";

        const translatedTitle =
          await translateToAlbanian(title);

        const priceKrw =
          vehicle?.advertisement?.price;

        const priceEur =
          krwToEur(priceKrw);

        const images =
          vehicle?.photos?.map(x => x.url) || [];

        const thumbnail =
          images[0] || null;

        const fuel =
          vehicle?.spec?.fuelType || "";

        const transmission =
          vehicle?.spec?.transmission || "";

        const year =
          vehicle?.category?.year || null;

        const mileage =
          vehicle?.spec?.mileage || null;

        const aiDescription = `
${translatedTitle}

Vetura është e importuar nga Koreja.

✔ Doganë deri në Durrës
✔ Kilometra reale
✔ Gjendje shumë e mirë
✔ Dokumentacion korrekt
✔ Transport i sigurt
        `;

        const payload = {
          id: car.Id,
          title: translatedTitle,
          description: aiDescription,
          price: priceEur,
          year,
          mileage,
          fuel: await translateToAlbanian(fuel),
          transmission: await translateToAlbanian(transmission),
          thumbnail,
          images,
          raw_data: vehicle,
          updated_at: new Date()
        };

        const { error } = await supabase
          .from("cars")
          .upsert(payload);

        if (error) {
          console.log("UPSERT ERROR", error);
        } else {
          console.log(`Saved ${car.Id}`);
        }

      } catch (err) {
        console.log("DETAIL ERROR", err.message);
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
        .delete()
        .in("id", soldIds);

      console.log(`Deleted ${soldIds.length} sold cars`);
    }

    console.log("SYNC DONE");

  } catch (err) {

    console.log("MAIN ERROR", err.message);
  }
}

cron.schedule("*/15 * * * *", syncCars);

syncCars();