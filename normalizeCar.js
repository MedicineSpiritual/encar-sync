import slugify from "slugify";

const fuelMap = {
  "가솔린": "Benzine",
  "디젤": "Naftë",
  "전기": "Elektrike",
  "하이브리드": "Hibride",
  "LPG": "Gas"
};

const transmissionMap = {
  "오토": "Automatik",
  "수동": "Manual"
};

const colorMap = {
  "흰색": "Bardhë",
  "검정색": "Zezë",
  "회색": "Hiri",
  "은색": "Argjendtë",
  "파란색": "Kaltër",
  "빨간색": "Kuqe"
};

export function normalizeCar(
  detail,
  options,
  inspection,
  diagnosis,
  verification
) {

  const vehicle =
    detail?.vehicle || detail || {};

  const category =
    vehicle?.category || {};

  const spec =
    vehicle?.spec || {};

  const photos =
    vehicle?.photos || [];

  const yearMonth =
    String(category?.yearMonth || "");

  const year =
    yearMonth.length >= 4
      ? Number(yearMonth.slice(0, 4))
      : null;

  const month =
    yearMonth.length >= 6
      ? Number(yearMonth.slice(4, 6))
      : null;

  if (year && year < 2016) {
    return null;
  }

  const images = photos
    .map(photo => {

      if (!photo?.path)
        return null;

      return (
        "https://ci.encar.com/carpicture" +
        photo.path +
        "?impolicy=heightRate"
      );
    })
    .filter(Boolean);

  const title = [
    category?.manufacturerEnglishName,
    category?.modelGroupEnglishName,
    category?.gradeDetailEnglishName
  ]
    .filter(Boolean)
    .join(" ");

  const priceKrw =
    vehicle?.advertisement?.price ||
    vehicle?.price ||
    null;

  const eurRate = 0.00067;

  const priceEur = priceKrw
    ? Math.round(
        (priceKrw * eurRate) + 1500
      )
    : null;

  return {

    id:
      vehicle?.vehicleId || null,

    title,

    slug:
      slugify(title || "car", {
        lower: true,
        strict: true
      }),

    manufacturer:
      category?.manufacturerEnglishName || null,

    model:
      category?.modelGroupEnglishName || null,

    grade:
      category?.gradeDetailEnglishName || null,

    year,

    month,

    price_krw:
      priceKrw,

    price_eur:
      priceEur,

    price:
      priceEur,

    currency:
      "EUR",

    mileage:
      spec?.mileage || null,

    fuel_type:
      fuelMap[
        spec?.fuelName
      ] ||
      spec?.fuelName ||
      null,

    transmission:
      transmissionMap[
        spec?.transmissionName
      ] ||
      spec?.transmissionName ||
      null,

    color:
      colorMap[
        spec?.colorName
      ] ||
      spec?.colorName ||
      null,

    body_type:
      spec?.bodyName || null,

    seats:
      spec?.seatCount || null,

    displacement:
      spec?.displacement || null,

    thumbnail:
      images[0] || null,

    images,

    options:
      options || [],

    inspection:
      inspection || null,

    accident:
      inspection?.accident ||
      null,

    diagnosis:
      diagnosis || null,

    verification:
      verification || null,

    raw_data:
      detail
  };
}