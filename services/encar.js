const axios = require("axios");

async function getCars(offset = 0) {

  const res = await axios.get(
    "https://api.encar.com/search/car/list/general",
    {
      params: {
        count: true,
        q: "(And.Hidden.N.)",
        sr: `|ModifiedDate|${offset}|50`
      }
    }
  );

  return res.data.SearchResults || [];
}

async function getCarDetail(id) {

  const res = await axios.get(
    `https://api.encar.com/v1/readside/vehicle/${id}`,
    {
      params: {
        include:
          "ADVERTISEMENT,CATEGORY,CONDITION,CONTACT,MANAGE,OPTIONS,PHOTOS,SPEC,PARTNERSHIP,CENTER,VIEW"
      }
    }
  );

  return res.data || {};
}

module.exports = {

  getCars,

  getCarDetail
};