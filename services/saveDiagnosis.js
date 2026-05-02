import { supabase }
from "../supabase.js";

export async function saveDiagnosis(
  carId,
  data
) {

  const {
    error
  } = await supabase

    .from("car_diagnosis")

    .upsert({

      car_id: carId,

      data

    });

  if (error)
    console.log(error);
}