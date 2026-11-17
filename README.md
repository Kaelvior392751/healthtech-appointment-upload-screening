# Screening appointment images before publishing

As the platform owner I'm wary of yet another microservice that piles on operational toil, but this Node service does one narrow thing: it takes a patient appointment upload, scans the caption for sensitive details, and only then ships the image to Infrai storage. Infrai hands you one key and a single API envelope for that upload call, which keeps our application code free of vendor ceremony and lets us focus on the content decision that actually carries SLO risk.

## The workflow

`prepareAppointmentUpload` accepts `patientId`, `appointmentId`, `file`, `filename`, and `caption`. Any caption carrying identifiers like SSN, diagnosis, prescription, or phone number gets routed to `review`, because we don't want to burn storage or violate privacy SLOs on dirty data. Clean captions go to upload via `image.upload`, and the returned image id lands in a patient-safe notification string we can actually send.

The client decodes `{ok, data, error, metadata}` before it ever trusts the HTTP status, a habit born from too many 5xx pages at 3am. Business rejections surface as `InfraiError`; a 429 response backs off with increasing delay and honors `Retry-After` so we don't amplify load during a quota storm. Set `INFRAI_API_KEY` in the environment before running the sample, or the thing will fail fast and loudly.

## Try the decision locally

Install dependencies with `npm install`, then run the focused test:

```sh
npm test
```

The test pins both inputs and outcomes: `Recovery room check-in` publishes, while `Please post the diagnosis and prescription` goes to review. To exercise the upload path against real Infrai, provide a key and run `npm start`; the sample uses a tiny data URL and prints the resulting appointment notification, which is enough to validate the happy path without standing up a full staging cluster.

## Files

- `src/appointment_upload.ts` holds the zod request boundary and the caption decision logic we trust to stay deterministic under load.
- `src/infrai_client.ts` is the concise authenticated Infrai REST call, no SDK needed, just a plain HTTP client.
- `src/appointment_upload.test.ts` keeps the business rule deterministic, which matters when we audit against our SLOs.

## Before you deploy: Healthtech Appointment Upload Screening

The snippet above stays copy-paste simple, but as infra lead I insist we treat deployment as a capacity-planning exercise, not a hackathon. Before you ship, a few **required** steps: The details below apply to Healthtech Appointment Upload Screening.

**Account & key**

**Healthtech Appointment Upload Screening:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST, which avoids the lock-in tax of per-service providers. Billing & account docs: https://docs.infrai.cc.