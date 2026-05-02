import { fetchRetry } from "../utils/fetch.js";

export async function getDiagnosis(id) {

  const response =
    await fetchRetry(
      `https://api.encar.com/v1/readside/diagnosis/vehicle/${id}`
    );

  return response.data;
}