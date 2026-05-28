import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { json, requireAdmin } from "../_utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || typeof file === "string") {
    return json({ error: "Upload an image file." }, 400);
  }

  if (!EXTENSIONS[file.type]) {
    return json({ error: "Use a JPG, PNG, WEBP, or GIF image." }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return json({ error: "Image must be 6MB or smaller." }, 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const fileName = `${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, fileName);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, bytes);

  return json({ url: `/uploads/${fileName}` }, 201);
}
