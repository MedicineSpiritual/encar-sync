import { fetchRetry } from "../utils/fetch.js";

export async function getVerification(id) {

  const response =
    await fetchRetry(
      `https://api.encar.com/verification/${id}/simple`
    );

  return response.data;
}