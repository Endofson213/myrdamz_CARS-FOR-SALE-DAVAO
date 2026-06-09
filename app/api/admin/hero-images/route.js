import {
  deleteHeroImage,
  readSupabaseHeroImages,
  saveSupabaseHeroImages,
  uploadHeroImage
} from "../../../../lib/supabase-store";
import { revalidatePath } from "next/cache";
import { json, requireAdmin } from "../_utils";

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const images = await readSupabaseHeroImages({ throwOnError: true });
    return json({ images: images || [] });
  } catch (error) {
    return heroError(error);
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || typeof file === "string") {
    return json({ error: "Upload a hero image." }, 400);
  }

  if (!EXTENSIONS[file.type]) {
    return json({ error: "Use a JPG, PNG, or WEBP hero image." }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return json({ error: "Hero image must be 6MB or smaller." }, 400);
  }

  let uploadedUrl = "";

  try {
    const currentImages = await readSupabaseHeroImages({ throwOnError: true });
    uploadedUrl = await uploadHeroImage({
      bytes: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      extension: EXTENSIONS[file.type]
    });
    if (!uploadedUrl) throw new Error("Supabase Storage is not configured.");

    const images = await saveSupabaseHeroImages([...(currentImages || []), uploadedUrl]);
    revalidatePath("/");
    return json({ images, url: uploadedUrl }, 201);
  } catch (error) {
    if (uploadedUrl) await deleteHeroImage(uploadedUrl);
    return heroError(error);
  }
}

export async function PUT(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { images } = await request.json();
    const currentImages = await readSupabaseHeroImages({ throwOnError: true });
    const nextImages = Array.isArray(images) ? images : [];

    if (
      nextImages.length !== currentImages.length
      || nextImages.some((image) => !currentImages.includes(image))
    ) {
      return json({ error: "Hero image ordering is invalid." }, 400);
    }

    const savedImages = await saveSupabaseHeroImages(nextImages);
    revalidatePath("/");
    return json({ images: savedImages });
  } catch (error) {
    return heroError(error);
  }
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { url } = await request.json();
    const currentImages = await readSupabaseHeroImages({ throwOnError: true });

    if (!currentImages.includes(url)) {
      return json({ error: "Hero image not found." }, 404);
    }

    const images = await saveSupabaseHeroImages(
      currentImages.filter((image) => image !== url)
    );
    await deleteHeroImage(url);
    revalidatePath("/");
    return json({ images });
  } catch (error) {
    return heroError(error);
  }
}

function heroError(error) {
  return json({
    error: error instanceof Error ? error.message : "Hero images could not be updated."
  }, 500);
}
