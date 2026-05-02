import axios from "axios";
import { CONFIG } from "../config.js";

const client = axios.create({

  headers: {
    ...CONFIG.HEADERS,

    Accept: "application/json",
    Connection: "keep-alive"
  },

  timeout: 30000
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

      console.error(
        `Retry ${i + 1}:`,
        err.message
      );

      if (i === retries - 1)
        throw err;

      await new Promise(r =>
        setTimeout(r, 3000)
      );
    }
  }
}