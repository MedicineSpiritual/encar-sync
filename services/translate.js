function fuel(value) {

  const map = {

    gasoline: "Benzinë",

    petrol: "Benzinë",

    diesel: "Dizel",

    hybrid: "Hibrid",

    electric: "Elektrik",

    lpg: "Gaz"
  };

  return map[
    String(value || "")
      .toLowerCase()
  ] || value;
}

function transmission(value) {

  const map = {

    automatic: "Automatik",

    manual: "Manual",

    cvt: "CVT",

    semiautomatic:
      "Gjysmë-automatik"
  };

  return map[
    String(value || "")
      .toLowerCase()
  ] || value;
}

module.exports = {

  fuel,

  transmission
};