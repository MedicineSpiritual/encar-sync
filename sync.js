import dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";

import { searchCars } from "./services/searchCars.js";
import { getVehicle } from "./services/getVehicle.js";
import { scrapeOptions } from "./services/scrapeOptions.js";
import { scrapeInspection } from "./services/scrapeInspection.js";
import { scrapeAccident } from "./services/scrapeAccident.js";
import { normalizeCar } from "./normalizeCar.js";
import { saveCar } from "./services/saveCar.js";
import { getRate } from "./services/currency.js";

const limit = pLimit(2);

async function processCar(car, rate) {

  try {

    console.log(
      `Processing ${car.Id}`
    );

    const detail =
      await getVehicle(car.Id);

    const options =
      await scrapeOptions(car.Id);

    const inspection =
      await scrapeInspection(car.Id);

    const accident =
      await scrapeAccident(car.Id);

    const normalized =
      normalizeCar(
        detail,
        options,
        inspection,
        accident,
        rate
      );

    await saveCar(normalized);

    console.log(
      `Saved ${car.Id}`
    );

  } catch (err) {

    console.error(
      `FAILED ${car.Id}`
    );

    console.error(err.message);
  }
}

async function run() {

  try {

    console.log(
      "Starting sync..."
    );

    const cars =
      await searchCars();

    console.log(
      `Found ${cars.length} cars`
    );

    const rate =
      await getRate();

    console.log(
      `KRW → EUR rate: ${rate}`
    );

    await Promise.all(
      cars.map(car =>
        limit(() =>
          processCar(car, rate)
        )
      )
    );

    console.log(
      "SYNC FINISHED"
    );

  } catch (err) {

    console.error(
      "SYNC FAILED"
    );

    console.error(err.message);
  }
}

run();
