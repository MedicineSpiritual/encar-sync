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

  await page.goto(
    "https://fem.encar.com/cars",
    {
      waitUntil: "domcontentloaded",
      timeout: 120000
    }
  );

  await page.waitForTimeout(10000);

  // scroll multiple times
  for (let i = 0; i < 5; i++) {

    await page.mouse.wheel(0, 5000);

    await page.waitForTimeout(3000);
  }

  const ids = await page.evaluate(() => {

    const results = [];

    const html = document.body.innerHTML;

    // find every carid=12345678
    const matches =
      html.match(/carid=\\d+/g) || [];

    matches.forEach(match => {

      const id =
        match.replace("carid=", "");

      results.push({
        Id: id
      });
    });

    return results;
  });

  await browser.close();

  return [
    ...new Map(
      ids.map(x => [x.Id, x])
    ).values()
  ];
}