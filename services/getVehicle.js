import axios from "axios";

export async function getVehicle(id) {

  const url =
    `https://api.encar.com/v1/readside/vehicle/${id}`;

  const response =
    await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0",
        "Accept":
          "application/json",
        "Referer":
          `https://www.encar.com/dc/dc_cardetailview.do?carid=${id}`
      }
    });

  return response.data;
}