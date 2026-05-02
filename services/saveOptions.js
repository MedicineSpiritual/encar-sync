import { supabase }
from "../supabase.js";

export async function saveOptions(
  carId,
  data
) {

  const {
    error
  } = await supabase

    .from("car_options")

    .upsert({

      car_id: carId,

      data

    });

  if (error)
    console.log(error);
}