export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { Storage } = await import("@google-cloud/storage");

    const storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL,
            private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
    });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return Response.json({ success: false, message: "Invalid file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await storage.bucket(process.env.GCS_BUCKET!)
        .file(file.name)
        .save(buffer);

    return Response.json({ success: true });
}
