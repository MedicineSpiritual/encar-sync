require("dotenv").config();

const cron = require("node-cron");

const supabase =
  require("./services/supabase");

const {
  getCars,
  getCarDetail
} = require("./services/encar");

const {
  fuel,
  transmission
} = require("./services/translate");

const {
  createSlug,
  normalizePrice,
  translateTitle
} = require("./services/helpers");

const {
  getInspectionData
} = require("./services/inspection");

const EUR_RATE =
  Number(process.env.EUR_RATE);

const TRANSPORT_FEE =
  Number(
    process.env.TRANSPORT_FEE
  );

async function syncCars() {

  try {

    console.log("SYNC START");

    let offset = 0;

    let allCars = [];

    while (true) {

      const cars =
        await getCars(offset);

      if (!cars.length)
        break;

      allCars.push(...cars);

      console.log(
        "TOTAL:",
        allCars.length
      );

      offset += 50;

      if (offset >= 1000)
        break;
    }

    const currentIds = [];

    for (const car of allCars) {

      try {

        const id =
          Number(car.Id);

        currentIds.push(id);

        console.log(
          "SYNC:",
          id
        );

        const detail =
          await getCarDetail(id);

        const inspection =
          await getInspectionData(id);

        const title = `
          ${car.Manufacturer || ""}
          ${car.Model || ""}
          ${car.Badge || ""}
        `
          .replace(/\s+/g, " ")
          .trim();

        const rawPrice =
          car.Price ||
          detail?.advertisement
            ?.price ||
          0;

        const priceKrw =
          normalizePrice(
            rawPrice
          );

        const priceEur =
          Math.round(
            priceKrw *
            EUR_RATE
          );

        const totalPrice =
          priceEur +
          TRANSPORT_FEE;

        let images = [];

        const photoSources = [

          ...(car.Photos || []),

          ...(detail?.photos || []),

          ...(detail?.photo || []),

          ...(detail
            ?.vehiclePhotos || []),

          ...(detail
            ?.advertisement
            ?.photos || [])
        ];

        for (const p of photoSources) {

          if (p?.path) {

            images.push(
              `https://ci.encar.com${p.path}`
            );
          }

          else if (p?.url) {

            images.push(
              p.url
            );
          }
        }

        images =
          [...new Set(images)];

        images =
          images.filter(
            img =>
              img &&
              img.startsWith(
                "http"
              )
          );

        const payload = {

          id,

          slug:
            createSlug(title),

          title,

          title_sq:
            translateTitle(
              title
            ),

          description:
            `${title} imported from Korea.`,

          description_sq:
            `${title} e importuar nga Korea me transport deri në Durrës.`,

          brand:
            car.Manufacturer,

          model:
            car.Model,

          badge:
            car.Badge,

          year:
            Number(
              car.Year
            ) || null,

          mileage:
            Number(
              car.Mileage ||

              detail?.spec
                ?.mileage ||

              detail?.category
                ?.mileage ||

              0
            ),

          fuel:
            fuel(
              car.FuelType ||

              detail?.spec
                ?.fuelType ||

              detail?.category
                ?.fuelType
            ),

          transmission:
            transmission(

              car.Transmission ||

              detail?.spec
                ?.transmission ||

              detail?.spec
                ?.missionType
            ),

          drivetrain:
            detail?.spec
              ?.driveType,

          engine:

            detail?.spec
              ?.engineDisplacement ||

            detail?.spec
              ?.displacement ||

            detail?.category
              ?.engine ||

            null,

          exterior_color:
            detail?.spec
              ?.bodyColor,

          interior_color:
            detail?.spec
              ?.seatColor,

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
            car.DealerName,

          seller_phone:
            detail?.contact
              ?.cellPhone,

          car_no:
            detail?.manage
              ?.carNo,

          vin:
            detail?.spec
              ?.vin,

          options:
            detail?.options ||
            [],

          inspection,

          inspection_url:
            `https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${id}`,

          encar_url:
            `https://fem.encar.com/cars/detail/${id}`,

          sold: false,

          raw_data: {

            search: car,

            detail,

            inspection
          },

          updated_at:
            new Date()
              .toISOString(),

          last_seen_at:
            new Date()
              .toISOString()
        };

        const { error } =
          await supabase
            .from("cars")
            .upsert(payload);

        if (error) {

          console.log(
            "SUPABASE ERROR:",
            error
          );

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
        .map(
          x =>
            Number(x.id)
        );

    if (soldIds.length) {

      await supabase
        .from("cars")
        .update({
          sold: true
        })
        .in(
          "id",
          soldIds
        );

      console.log(
        "SOLD:",
        soldIds.length
      );
    }

    console.log(
      "SYNC DONE"
    );

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