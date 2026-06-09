import { cleanupExpiredVehiclePhotos } from "../../../../lib/supabase-store";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authorization = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET
    || authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredVehiclePhotos();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Image cleanup failed."
    }, { status: 500 });
  }
}
