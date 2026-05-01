function createSlug(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizePrice(value) {

  if (!value) return 0;

  const num = Number(
    String(value)
      .replace(/,/g, "")
  );

  // ENCAR:
  // 2520 => 25,200,000 KRW

  if (num < 1000000) {
    return num * 10000;
  }

  return num;
}

function translateTitle(title) {

  return String(title || "")

    .replace(/Gasoline/gi, "Benzinë")

    .replace(/Diesel/gi, "Dizel")

    .replace(/Hybrid/gi, "Hibrid")

    .replace(/Electric/gi, "Elektrik")

    .replace(/Automatic/gi, "Automatik")

    .replace(/Manual/gi, "Manual");
}

module.exports = {

  createSlug,

  normalizePrice,

  translateTitle
};