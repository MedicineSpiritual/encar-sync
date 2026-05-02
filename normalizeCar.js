import slugify from "slugify";

const fuelMap = {
  "가솔린": "Petrol",
  "디젤": "Diesel",
  "전기": "Electric",
  "하이브리드": "Hybrid",
  "LPG": "LPG"
};

const transmissionMap = {
  "오토": "Automatic",
  "수동": "Manual",
  "세미오토": "Semi Automatic",
  "CVT": "CVT"
};

const colorMap = {
  "흰색": "White",
  "검정색": "Black",
  "회색": "Gray",
  "은색": "Silver",
  "파란색": "Blue",
  "빨간색": "Red",
  "진주색": "Pearl White"
};

export function normalizeCar(
  detail,
  options,
  inspection,
  diagnosis,
  verification,
  inspectionDetail
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

  if (year && year < 2015) {
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

  const rawPrice =
    Number(category?.price) || 0;

  const price_krw =
    rawPrice * 10000;

  const eurRate = 1728;

  const baseEuro =
    price_krw / eurRate;

  const price_eur =
    Math.floor(baseEuro + 1500);

  const fuel =
    fuelMap[spec?.fuelName]
    || spec?.fuelName
    || null;

  const transmission =
    transmissionMap[spec?.transmissionName]
    || spec?.transmissionName
    || null;

  const color =
    colorMap[spec?.colorName]
    || spec?.colorName
    || null;

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

    price_krw,

    price_eur,

    price:
      price_eur,

    currency:
      "EUR",

    mileage:
      spec?.mileage || null,

    fuel_type:
      fuel,

    transmission:
      transmission,

    color:
      color,

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
      options || {},

    inspection:
      inspection || {},

    diagnosis:
      diagnosis || {},

    verification:
      verification || {},

    accident:
      inspectionDetail || {},

    inspection_detail:
      inspectionDetail || {},

    raw_data:
      detail
  };
}