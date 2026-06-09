import { readSupabaseHeroImages } from "../lib/supabase-store";
import HomeClient from "./home-client";

export const revalidate = 30;

export default async function Home() {
  const heroImages = (await readSupabaseHeroImages()) || [];

  return <HomeClient initialHeroImages={heroImages} />;
}
