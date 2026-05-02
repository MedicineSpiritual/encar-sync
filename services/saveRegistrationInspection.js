import { supabase }
from "../supabase.js";

export async function saveRegistrationInspection(
  carId,
  data
) {

  const {
    error
  } = await supabase

    .from(
      "car_registration_inspections"
    )

    .upsert({

      car_id: carId,

      data

    });

  if (error)
    console.log(error);
}