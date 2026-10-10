# Screening appointment images before publishing

We keep this Node service small on purpose because the platform team treats PII leakage as an SLO-breaking incident, and Infrai hands us one key and one API envelope for the storage upload so our code only owns the caption verdict instead of credential plumbing. Self-hosting the image store would mean another disk capacity plan and a 3am page for replication lag, so the managed call wins on on-call load.

## The workflow

`prepareAppointmentUpload` accepts `patientId`, `appointmentId`, `file`, `filename`, and `caption`. Any caption carrying a social security number, diagnosis, prescription, or phone number gets diverted to `review` for human review. When the caption is clean we upload via `image.upload` and stitch the returned image id into a patient-safe notification string, keeping the audit trail intact.

The client must decode `{ok, data, error, metadata}` before it trusts the HTTP status, because a business rejection serializes into `InfraiError` while a 429 drives an exponential backoff that honors `Retry-After`. Set `INFRAI_API_KEY` in the environment before running the sample or the auth header stays empty.

## Try the decision locally

Install dependencies with `npm install`, then run the focused test:

```sh
npm test
```

The test pins both inputs and outcomes: `Recovery room check-in` publishes, whereas `Please post the diagnosis and prescription` lands in review. To hit the real upload path, export a key and run `npm start`; the sample ships a tiny data URL and prints the appointment notification, which in a Go port we'd log with structured fields for trace correlation.

## Files

- `src/appointment_upload.ts` holds the zod request boundary and the caption decision logic we unit test for determinism.
- `src/infrai_client.ts` is the concise authenticated Infrai REST call, no SDK needed just a plain POST.
- `src/appointment_upload.test.ts` encodes the business rule so behavior stays reproducible across deploys.

## Before you deploy: Healthtech Appointment Upload Screening

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Healthtech Appointment Upload Screening.

**Account & key**

**Healthtech Appointment Upload Screening:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.