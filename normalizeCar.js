import slugify from "slugify";

import { parseYearMonth } from "./utils/year.js";
import { buildHQImage } from "./utils/images.js";

export function normalizeCar(
  detail,
  options,
  inspection,
  accident,
  rate
) {

  const category =
    detail?.detail?.category || {};

  const spec =
    detail?.detail?.spec || {};

  const photos =
    detail?.detail?.photos || [];

  const advertisement =
    detail?.detail?.advertisement || {};

  const {
    year,
    month
  } = parseYearMonth(
    category.yearMonth
  );

  const images = photos
    .map(photo => {

      if (!photo?.path) {
        return null;
      }

      return buildHQImage(
        photo.path
      );
    })
    .filter(Boolean);

  const priceKRW =
    advertisement.price || 0;

  const priceEUR =
    Math.round(priceKRW * rate);

  const title = [
    category.manufacturerEnglishName,
    category.modelGroupEnglishName,
    category.gradeDetailEnglishName
  ]
    .filter(Boolean)
    .join(" ");

  return {

    id:
      detail?.detail?.vehicleId || null,

    title:
      title || null,

    slug:
      slugify(title || "vehicle", {
        lower: true,
        strict: true
      }),

    manufacturer:
      category.manufacturerEnglishName || null,

    model:
      category.modelGroupEnglishName || null,

    grade:
      category.gradeDetailEnglishName || null,

    year:
      year,

    month:
      month,

    price_krw:
      priceKRW,

    price_eur:
      priceEUR,

    mileage:
      spec.mileage || null,

    fuel_type:
      spec.fuelName || null,

    transmission:
      spec.transmissionName || null,

    body_type:
      spec.bodyName || null,

    color:
      spec.colorName || null,

    displacement:
      spec.displacement || null,

    seats:
      spec.seatCount || null,

    thumbnail:
      images.length > 0
        ? images[0]
        : null,

    images:
      images,

    options:
      options || {},

    inspection:
      inspection || {},

    accident:
      accident || {},

    raw_data:
      detail || {}
  };
}
