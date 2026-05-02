import { supabase }
from "../supabase.js";

export async function saveCar(
  car
) {

  const {
    error
  } = await supabase

    .from("cars")

    .upsert([car], {
  onConflict: "id"
});

  if (error) {

    console.log(error);

    throw error;
  }
}