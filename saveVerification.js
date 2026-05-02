import { supabase }
from "../supabase.js";

export async function saveVerification(
  carId,
  data
) {

  const {
    error
  } = await supabase
    .from("car_verification")
    .upsert({
      car_id: carId,
      data
    });

  if (error)
    console.log(error);
}