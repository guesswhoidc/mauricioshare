import path from "node:path";
import fsPromises from "node:fs/promises";

export const APP_NAME = process.env['APP_NAME'] ?? "APP_NAME";
export const PORT = process.env['PORT'] ?? "3290";
export const UPLOAD_PATH : string = process.env['UPLOAD_PATH'] ?? "";

try {
  if (!UPLOAD_PATH) {
    throw "please set a UPLOAD_PATH on your environment variables";
  }

  await fsPromises.access(UPLOAD_PATH, fsPromises.constants.R_OK | fsPromises.constants.W_OK);
} catch (err) {
  console.error("Couldn't get access to the UPLOAD_PATH: ", err);
  process.exit(1);
}

export const uploadPathJoin = path.join.bind(null, UPLOAD_PATH);
