import dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";

import { searchCars }
from "./services/searchCars.js";

import { getVehicle }
from "./services/getVehicle.js";

import { getOptions }
from "./services/getOptions.js";

import { getInspection }
from "./services/getInspection.js";

import { getDiagnosis }
from "./services/getDiagnosis.js";

import { getRegistrationInspection }
from "./services/getRegistrationInspection.js";

import { normalizeCar }
from "./normalizeCar.js";

import { saveCar }
from "./services/saveCar.js";

import { saveOptions }
from "./services/saveOptions.js";

import { saveInspection }
from "./services/saveInspection.js";

import { saveDiagnosis }
from "./services/saveDiagnosis.js";

import { saveRegistrationInspection }
from "./services/saveRegistrationInspection.js";

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
      2000 + Math.random() * 3000
    );

    const detail =
      await getVehicle(id);

    if (!detail) {

      console.log(
        `NO DETAIL ${id}`
      );

      return;
    }

    const normalized =
      normalizeCar(detail);
    detail,
    options,
    inspection,
    diagnosis,
    verification,
    inspectionDetail

    if (!normalized) {

      console.log(
        `SKIPPED ${id}`
      );

      return;
    }

    await saveCar(
      normalized
    );

    console.log(
      `CAR SAVED ${id}`
    );

    const options =
      await getOptions(id);

    if (
      options &&
      options.length
    ) {

      await saveOptions(
        id,
        options
      );

      console.log(
        `OPTIONS SAVED ${id}`
      );
    }

    const inspection =
      await getInspection(id);

    if (inspection) {

      await saveInspection(
        id,
        inspection
      );

      console.log(
        `INSPECTION SAVED ${id}`
      );
    }

    const diagnosis =
      await getDiagnosis(id);

    if (diagnosis) {

      await saveDiagnosis(
        id,
        diagnosis
      );

      console.log(
        `DIAGNOSIS SAVED ${id}`
      );
    }

    const registrationInspection =
      await getRegistrationInspection(
        id
      );

    if (
      registrationInspection
    ) {

      await saveRegistrationInspection(
        id,
        registrationInspection
      );

      console.log(
        `REGISTRATION SAVED ${id}`
      );
    }

  } catch (err) {

    console.log(
      `FAILED ${car.Id}`
    );

    console.log(err);
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

    await Promise.all(

      cars.map(car =>

        limit(() =>
          processCar(car)
        )

      )

    );

    console.log(
      "SYNC FINISHED"
    );

  } catch (err) {

    console.log(
      "SYNC FAILED"
    );

    console.log(err);
  }
}

run();