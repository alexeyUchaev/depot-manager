import { prisma } from "@/lib/prisma";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "@/lib/constants";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Store a chat attachment (image or PDF) in the database and return its
 * metadata. The binary is forwarded to Gemini later, when the user sends the
 * message it is attached to (see app/api/chat/route.ts).
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Unsupported file type: ${file.type || "unknown"}` },
        { status: 415 }
      );
    }
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: "File is too large (max 15 MB)" },
        { status: 413 }
      );
    }

    const data = Buffer.from(await file.arrayBuffer());

    const attachment = await prisma.chatAttachment.create({
      data: {
        orgId: DEMO_TENANT_ID,
        userId: DEMO_USER_ID,
        filename: file.name || "attachment",
        mimeType: file.type,
        size: file.size,
        data,
      },
      select: { id: true, filename: true, mimeType: true, size: true },
    });

    return Response.json(attachment);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Upload failed";
    return Response.json({ error }, { status: 500 });
  }
}
