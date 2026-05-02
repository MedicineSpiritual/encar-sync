export const CONFIG = {
  MIN_YEAR: 2016,
  CONCURRENCY: 2,

  ENCAR_SEARCH:
    "https://api.encar.com/search/car/list/general",

  ENCAR_DETAIL:
    "https://api.encar.com/v1/readside/vehicle",

  HEADERS: {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://fem.encar.com/",
    "Accept-Language":
      "ko-KR,ko;q=0.9,en;q=0.8"
  }
};
