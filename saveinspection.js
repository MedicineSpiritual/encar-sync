import { supabase }
from "../supabase.js";

export async function saveInspection(
  carId,
  data
) {

  const {
    error
  } = await supabase
    .from("car_inspections")
    .upsert({
      car_id: carId,
      data
    });

  if (error)
    console.log(error);
}