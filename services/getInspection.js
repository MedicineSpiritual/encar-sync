import { fetchRetry } from "../utils/fetch.js";

export async function getInspection(id) {

  const response =
    await fetchRetry(
      `https://api.encar.com/v1/readside/inspection/vehicle/${id}`
    );

  return response.data;
}