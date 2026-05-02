import dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";

import { searchCars } from "./services/searchCars.js";
import { searchImportedCars } from "./services/searchImportedCars.js";

import { getVehicle } from "./services/getVehicle.js";
import { getOptions } from "./services/getOptions.js";
import { getInspection } from "./services/getInspection.js";
import { getDiagnosis } from "./services/getDiagnosis.js";
import { getVerification } from "./services/getVerification.js";

import { normalizeCar } from "./normalizeCar.js";

import { saveCar } from "./services/saveCar.js";

const limit = pLimit(2);

function delay(ms) {

  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function processCar(car) {

  try {

    const id = car.Id;

    console.log(
      `Processing ${id}`
    );

    await delay(
      1000 + Math.random() * 2000
    );

    const detail =
      await getVehicle(id);

    const options =
      await getOptions(id);

    const inspection =
      await getInspection(id);

    const diagnosis =
      await getDiagnosis(id);

    const verification =
      await getVerification(id);

    const normalized =
      normalizeCar(
        detail,
        options,
        inspection,
        diagnosis,
        verification
      );

    if (!normalized) {

      console.log(
        `Skipped ${id}`
      );

      return;
    }

    await saveCar(normalized);

    console.log(
      `Saved ${id}`
    );

  } catch (err) {

    console.error(
      `FAILED ${car.Id}`
    );

    console.error(
      err.message
    );
  }
}

async function run() {

  try {

    console.log(
      "Starting sync..."
    );

    // domestic
    const domesticCars =
      await searchCars();

    console.log(
      `Domestic cars: ${domesticCars.length}`
    );

    // imported
    const importedCars =
      await searchImportedCars();

    console.log(
      `Imported cars: ${importedCars.length}`
    );

    // merge
    const cars = [
      ...domesticCars,
      ...importedCars
    ];

    // remove duplicates
    const uniqueCars = [
      ...new Map(
        cars.map(x => [x.Id, x])
      ).values()
    ];

    console.log(
      `Total unique cars: ${uniqueCars.length}`
    );

    await Promise.all(
      uniqueCars.map(car =>
        limit(() =>
          processCar(car)
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

    console.error(
      err.message
    );
  }
}

run();