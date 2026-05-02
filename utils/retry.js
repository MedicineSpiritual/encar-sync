import axios from "axios";
import { CONFIG } from "../config.js";

const client = axios.create({
  headers: CONFIG.HEADERS
});

export async function fetchRetry(
  url,
  options = {},
  retries = 3
) {

  for (let i = 0; i < retries; i++) {

    try {

      return await client.get(
        url,
        options
      );

    } catch (err) {

      if (i === retries - 1)
        throw err;

      await new Promise(r =>
        setTimeout(r, 2000)
      );
    }
  }
}