import { chromium } from "playwright";

export async function searchCars() {

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ]
});

  const page =
    await browser.newPage();

  await page.goto(
    "https://fem.encar.com/cars",
    {
      waitUntil: "networkidle"
    }
  );

  await page.waitForTimeout(5000);

  const ids =
    await page.evaluate(() => {

      const results = [];

      document
        .querySelectorAll("a")
        .forEach(el => {

          const href =
            el.getAttribute("href");

          if (!href) return;

          const match =
            href.match(/carid=(\\d+)/);

          if (!match) return;

          results.push({
            Id: match[1]
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