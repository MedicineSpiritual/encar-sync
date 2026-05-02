import slugify from "slugify";

function buildImage(path) {

  if (!path) {
    return null;
  }

  // nëse është url komplet
  if (typeof path === "string" && path.startsWith("http")) {
    return path;
  }

  // path normal nga encar
  return `https://ci.encar.com${path}?impolicy=heightRate`;
}

export function normalizeCar(
  detail,
  options,
  inspection,
  diagnosis
) {

  const vehicle =
    detail?.vehicle || detail || {};

  const category =
    vehicle?.category || {};

  const spec =
    vehicle?.spec || {};

  const photos =
    vehicle?.photos || [];

  const cleanYearMonth =
    String(
      category?.yearMonth || ""
    ).replace(/[^\d]/g, "");

  const year =
    cleanYearMonth.length >= 4
      ? Number(cleanYearMonth.slice(0, 4))
      : null;

  const month =
    cleanYearMonth.length >= 6
      ? Number(cleanYearMonth.slice(4, 6))
      : null;

  // filtro veturat para 2016
  if (year && year < 2016) {
    return null;
  }

  const images = photos
    .map(photo => {

      const path =
        photo?.path ||
        photo?.Path ||
        null;

      return buildImage(path);

    })
    .filter(Boolean);

  const title = [
    category?.manufacturerEnglishName,
    category?.modelGroupEnglishName,
    category?.gradeDetailEnglishName
  ]
    .filter(Boolean)
    .join(" ");

  return {

    id:
      vehicle?.vehicleId || null,

    title,

    slug:
      slugify(
        `${title}-${vehicle?.vehicleId || ""}`,
        {
          lower: true,
          strict: true
        }
      ),

    manufacturer:
      category?.manufacturerEnglishName || null,

    model:
      category?.modelGroupEnglishName || null,

    grade:
      category?.gradeDetailEnglishName || null,

    year,

    month,

    mileage:
      spec?.mileage || null,

    fuel_type:
      spec?.fuelName || null,

    transmission:
      spec?.transmissionName || null,

    color:
      spec?.colorName || null,

    displacement:
      spec?.displacement || null,

    price:
      vehicle?.advertisementPrice || null,

    thumbnail:
      images[0] || null,

    images,

    options:
      options || null,

    inspection:
      inspection || null,

    diagnosis:
      diagnosis || null,

    raw_data:
      detail
  };
}