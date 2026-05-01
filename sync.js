const axios = require("axios");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toEur(priceKrw) {
  if (!priceKrw) return null;
  return Math.round(priceKrw * 0.00067);
}

function createSlug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildTitle(car) {
  return `${car.Manufacturer || ""} ${car.Model || ""} ${car.Badge || ""}`.trim() || "Pa titull";
}

function translateFuel(fuel) {
  const map = {
    gasoline: "Benzinë",
    diesel: "Dizel",
    hybrid: "Hibrid",
    electric: "Elektrik",
  };
  return map[String(fuel || "").toLowerCase()] || fuel || "";
}

function translateTransmission(t) {
  const map = {
    automatic: "Automatik",
    manual: "Manual",
    cvt: "CVT",
  };
  return map[String(t || "").toLowerCase()] || t || "";
}

async function syncCars() {
  try {
    console.log("SYNC START");

    let offset = 0;
    const pageSize = 50;
    let allCars = [];

    while (true) {
      const inventory = await axios.get("https://api.encar.com/search/car/list/general", {
        params: {
          count: true,
          q: "(And.Hidden.N.)",
          sr: `|ModifiedDate|${offset}|${pageSize}`,
        },
      });

      const cars = inventory.data?.SearchResults || [];
      if (!cars.length) break;

      allCars = allCars.concat(cars);
      console.log(`Loaded ${allCars.length}`);

      offset += pageSize;

      // rregullo sipas nevojës; hiqe këtë limit kur të jesh gati
      if (offset >= 300) break;
    }

    const seenIds = [];

    for (const car of allCars) {
      try {
        seenIds.push(Number(car.Id));

        const detailRes = await axios.get(
          `https://api.encar.com/v1/readside/vehicle/${car.Id}`,
          {
            params: {
              include: "ADVERTISEMENT,CATEGORY,CONDITION,CONTACT,MANAGE,OPTIONS,PHOTOS,SPEC,PARTNERSHIP,CENTER,VIEW",
            },
          }
        );

        const detail = detailRes.data || {};

        const title = buildTitle(car);
        const photos = Array.isArray(car.Photos) ? car.Photos : [];
        const thumbnail =
          photos[0]?.path ? `https://ci.encar.com${photos[0].path}` :
          photos[0]?.url || car.Photo?.url || null;

        const images = photos.map((p) =>
          p.path ? `https://ci.encar.com${p.path}` : p.url || p
        ).filter(Boolean);

        const priceKrw = Number(car.Price || detail?.advertisement?.price || 0);
        const priceEur = toEur(priceKrw);

        const payload = {
          id: Number(car.Id),
          title,
          title_sq: title,               // këtu mund ta përkthesh realisht më vonë
          slug: createSlug(title),
          description: `${title} e importuar nga Korea.`,
          description_sq: `${title} e importuar nga Korea.`,
          brand: car.Manufacturer || null,
          model: car.Model || null,
          badge: car.Badge || null,
          year: Number(car.Year || detail?.category?.year || null),
          mileage: Number(car.Mileage || null),
          fuel: translateFuel(car.FuelType || detail?.spec?.fuelType || ""),
          transmission: translateTransmission(car.Transmission || detail?.spec?.transmission || ""),
          drivetrain: detail?.spec?.driveType || null,
          engine: detail?.spec?.engineDisplacement || null,
          exterior_color: detail?.spec?.bodyColor || null,
          interior_color: detail?.spec?.seatColor || null,
          price_krw: priceKrw || null,
          price_eur: priceEur,
          transport_fee_eur: 0, // vendose me logjikën tënde të dukshme
          customs_fee_eur: 0,   // vendose me logjikën tënde të dukshme
          total_price_eur: priceEur,
          thumbnail,
          images,
          seller_name: car.DealerName || detail?.seller?.name || null,
          seller_phone: null,
          car_no: null,
          vin: detail?.spec?.vin || null,
          accident_history: null,
          options: null,
          raw_data: { search: car, detail },
          sold: false,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("cars").upsert(payload);

        if (error) {
          console.log("SUPABASE ERROR", error);
        } else {
          console.log("Saved", car.Id);
        }

      } catch (err) {
        console.log("CAR ERROR", car.Id, err.message);
      }
    }

    // sold detection: vetëm pasi të ketë përfunduar një sync i plotë
    const { data: existingCars } = await supabase.from("cars").select("id");
    const soldIds = (existingCars || [])
      .filter((x) => !seenIds.includes(Number(x.id)))
      .map((x) => Number(x.id));

    if (soldIds.length) {
      await supabase.from("cars").update({ sold: true }).in("id", soldIds);
      console.log("Sold:", soldIds.length);
    }

    console.log("SYNC DONE");
  } catch (err) {
    console.log("MAIN ERROR", err.message);
  }
}

cron.schedule("*/15 * * * *", syncCars);
syncCars();