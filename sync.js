import dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";

import { searchCars } from "./services/searchCars.js";
import { getVehicle } from "./services/getVehicle.js";
import { getOptions } from "./services/getOptions.js";
import { getInspection } from "./services/getInspection.js";
import { getDiagnosis } from "./services/getDiagnosis.js";
import { getVerification } from "./services/getVerification.js";
import { getInspectionDetail } from "./services/getInspectionDetail.js";

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

    let options = {};

    let inspection = {};

    let diagnosis = {};

    let verification = {};

    let inspectionDetail = {};

    try {

      options =
        await getOptions(id);

    } catch (err) {

      console.log(
        `OPTIONS FAILED ${id}`
      );
    }

    try {

      inspection =
        await getInspection(id);

    } catch (err) {

      console.log(
        `INSPECTION FAILED ${id}`
      );
    }

    try {

      diagnosis =
        await getDiagnosis(id);

    } catch (err) {

      console.log(
        `DIAGNOSIS FAILED ${id}`
      );
    }

    try {

      verification =
        await getVerification(id);

    } catch (err) {

      console.log(
        `VERIFICATION FAILED ${id}`
      );
    }

    try {

      inspectionDetail =
        await getInspectionDetail(id);

    } catch (err) {

      console.log(
        `INSPECTION DETAIL FAILED ${id}`
      );
    }

    const normalized =
      normalizeCar(
        detail,
        options,
        inspection,
        diagnosis,
        verification,
        inspectionDetail
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

    console.error(err);
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

    console.error(
      "SYNC FAILED"
    );

    console.error(err);
  }
}

run();