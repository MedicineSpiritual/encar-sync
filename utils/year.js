export function parseYearMonth(raw) {

  const value = String(raw || "");

  return {
    year:
      value.length >= 4
        ? Number(value.slice(0, 4))
        : null,

    month:
      value.length >= 6
        ? Number(value.slice(4, 6))
        : null
  };
}
