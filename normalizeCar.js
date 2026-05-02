import slugify from "slugify";

export function normalizeCar(
  detail,
  options,
  inspection,
  diagnosis,
  verification
) {

  options = options || {};
  inspection = inspection || {};
  diagnosis = diagnosis || {};
  verification = verification || {};

  const vehicle =
    detail?.vehicle || detail || {};

  const category =
    vehicle?.category || {};

  const spec =
    vehicle?.spec || {};

  const photos =
    vehicle?.photos || [];

  const yearMonth =
    String(
      category?.yearMonth || ""
    );

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
        "https://ci.encar.com/carpicture/carpicture" +
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

    thumbnail:
      images[0] || null,

    images,

    options,

    inspection,

    diagnosis,

    verification,

    raw_data:
      detail
  };
}