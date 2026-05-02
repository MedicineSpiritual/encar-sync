import { chromium } from "playwright";

export async function searchCars() {

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const page = await browser.newPage();

  const foundCars = [];

  page.on("response", async response => {

    try {

      const url = response.url();

      // capture Encar API responses
      if (
        url.includes("api") ||
        url.includes("search") ||
        url.includes("list")
      ) {

        const contentType =
          response.headers()["content-type"] || "";

        if (
          contentType.includes("application/json")
        ) {

          const data =
            await response.json();

          // recursive scan for vehicle ids
          const jsonString =
            JSON.stringify(data);

          const matches =
            jsonString.match(/"vehicleId":\\d+/g) || [];

          matches.forEach(match => {

            const id =
              match.replace('"vehicleId":', "");

            foundCars.push({
              Id: id
            });
          });
        }
      }

    } catch (err) {
      // ignore parse errors
    }
  });

  await page.goto(
    "https://fem.encar.com/cars",
    {
      waitUntil: "networkidle",
      timeout: 120000
    }
  );

  await page.waitForTimeout(15000);

  // trigger more requests
  for (let i = 0; i < 10; i++) {

    await page.mouse.wheel(0, 7000);

    await page.waitForTimeout(2000);
  }

  await browser.close();

  return [
    ...new Map(
      foundCars.map(x => [x.Id, x])
    ).values()
  ];
}