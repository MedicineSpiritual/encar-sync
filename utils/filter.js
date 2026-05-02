import { parseYearMonth } from "./year.js";

export function filterCars(cars) {

  return cars.filter(car => {

    const { year } =
      parseYearMonth(car.Year);

    return year >= 2016;
  });
}
