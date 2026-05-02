import axios from "axios";
import fs from "fs";

const FILE = "currency.json";

export async function getRate() {

  let cached = {
    rate: 0.00067,
    updated: 0
  };

  if (fs.existsSync(FILE)) {

    cached = JSON.parse(
      fs.readFileSync(FILE, "utf8")
    );
  }

  const age =
    Date.now() - cached.updated;

  if (age < 1000 * 60 * 60) {
    return cached.rate;
  }

  const response =
    await axios.get(
      "https://api.exchangerate.host/latest?base=KRW&symbols=EUR"
    );

  const rate =
    response.data.rates.EUR;

  fs.writeFileSync(
    FILE,
    JSON.stringify({
      rate,
      updated: Date.now()
    })
  );

  return rate;
}
