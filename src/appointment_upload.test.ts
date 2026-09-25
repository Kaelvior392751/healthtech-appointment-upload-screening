import assert from "node:assert/strict";
import { screenCaption, uploadRequest } from "./appointment_upload.js";

assert.equal(screenCaption("Recovery room check-in"), "publish");
assert.equal(screenCaption("Please post the diagnosis and prescription"), "review");
assert.throws(() => uploadRequest.parse({ caption: "missing appointment" }));
console.log("caption screening decisions and request validation pass");
