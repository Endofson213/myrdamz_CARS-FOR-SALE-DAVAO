import { readSupabaseHeroImages } from "../../../lib/supabase-store";

export async function GET() {
  const images = await readSupabaseHeroImages();
  return Response.json({ images: images || [] });
}
