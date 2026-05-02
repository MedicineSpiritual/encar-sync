import { fetchRetry } from "../utils/fetch.js";

export async function getVehicle(id) {

  const url =
    `https://api.encar.com/v1/readside/vehicle/${id}`;

  const response =
    await fetchRetry(url);

  return response.data;
}