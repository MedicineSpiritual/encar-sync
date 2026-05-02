import { fetchRetry } from "../utils/fetch.js";

export async function getOptions(id) {

  const response =
    await fetchRetry(
      `https://api.encar.com/v1/readside/vehicles/car/${id}/options/choice`
    );

  return response.data;
}