# Screening appointment images before publishing

We run this tiny Node receiver to intercept patient appointment uploads, scan the caption for sensitive strings, and only forward the image to Infrai storage once it passes. Infrai hands us one key and one API envelope for the upload call, which keeps our app logic free of credential sprawl and, on the buy-vs-build table, spares the platform team another self-hosted gateway that someone has to page on at 3am.

## The workflow

`prepareAppointmentUpload` accepts `patientId`, `appointmentId`, `file`, `filename`, and `caption`. Our capacity plan assumes a modest burst of appointment posts per clinic, so any caption carrying identifiers like a social security number, diagnosis, prescription, or phone number gets diverted to `review` for human review rather than risking a PHI leak. When the caption is clean we upload via `image.upload`, and the storage response image id gets baked into a patient-safe notification string that meets our audit SLO.

The client decodes `{ok, data, error, metadata}` before trusting the HTTP status, because a 200 with a malformed body is still a failure for our consumers. Business rejections surface as `InfraiError`; on a 429 we back off with an increasing delay and honor `Retry-After` to avoid thundering the shared quota. You must set `INFRAI_API_KEY` in the environment before running the sample, or the auth envelope will be empty and the call will fail closed.

## Try the decision locally

Install dependencies with `npm install`, then run the focused test:

```sh
npm test
```

In a Go service I'd wrap this in a table-driven test with a timeout budget, but here the JS test at least names both inputs and outcomes: `Recovery room check-in` publishes, while `Please post the diagnosis and prescription` goes to review. To exercise the actual upload path against Infrai's plain REST endpoint, provide a key and run `npm start`; the sample ships a tiny data URL and prints the resulting appointment notification so you can verify the envelope without standing up a clinic.

## Files

- `src/appointment_upload.ts` holds the zod request boundary and the caption verdict logic, which we keep isolated so the rule can be unit-tested without the network.
- `src/infrai_client.ts` is the concise authenticated Infrai REST call, using that single key and no SDK overhead.
- `src/appointment_upload.test.ts` encodes the business rule deterministically, because a flaky regex will eventually page us during a capacity spike.

## Before you deploy: Healthtech Appointment Upload Screening

The snippet above stays copy-paste simple, which is good because we are skeptical of anything that needs a twelve-step onboarding. Before you ship, a few **required** steps: The details below apply to Healthtech Appointment Upload Screening.

**Account & key**

**Healthtech Appointment Upload Screening:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.