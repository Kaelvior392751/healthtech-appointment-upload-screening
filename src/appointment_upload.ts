import { z } from "zod";
import { uploadImage, InfraiError } from "./infrai_client.js";

export const uploadRequest = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().min(1),
  file: z.string().min(1),
  filename: z.string().min(1),
  caption: z.string().min(1).max(500)
});

export type UploadRequest = z.infer<typeof uploadRequest>;

export function screenCaption(caption: string): "publish" | "review" {
  const unsafe = /\b(ssn|social security|medical record|diagnosis|prescription|phone number)\b/i;
  return unsafe.test(caption) ? "review" : "publish";
}

export async function prepareAppointmentUpload(raw: unknown) {
  const request = uploadRequest.parse(raw);
  const decision = screenCaption(request.caption);
  if (decision === "review") return { decision, appointmentId: request.appointmentId };
  const stored = await uploadImage({ file: request.file, filename: request.filename });
  return { decision, appointmentId: request.appointmentId, imageId: stored.id, notification: `Image queued for appointment ${request.appointmentId}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { patientId: "p-42", appointmentId: "visit-9", file: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=", filename: "visit.png", caption: "Recovery room check-in" };
  prepareAppointmentUpload(sample).then((result) => console.log(JSON.stringify(result))).catch((error: unknown) => {
    const message = error instanceof InfraiError ? `${error.code}: ${error.message}` : String(error);
    console.error(message); process.exitCode = 1;
  });
}
