import { supabase } from "../supabase.js";

export async function saveCar(car) {

  const { error } =
    await supabase
      .from("cars")
      .upsert(car);

  if (error) {

    console.error(error);

    throw error;
  }
}