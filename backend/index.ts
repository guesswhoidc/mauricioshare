import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { createWriteStream } from 'node:fs';
import fsPromises from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import notifier from 'node-notifier';

const APP_NAME = process.env['APP_NAME'] ?? "APP_NAME";
const PORT = process.env['PORT'] ?? "3290";

function appNotify(message : string) {
  if (!process.env['NOTIFY']) {
    return;
  }
  console.log(`notify: ${APP_NAME}: ${message}`);
  notifier.notify({
    title: `${APP_NAME} Back-End server`,
    message
  });
}
if (!process.env['NOTIFY']) {
  console.info("Set the environment variable NOTIFY=true to get desktop notifications");
}

const fastify = Fastify({
  logger: true
})

fastify.register(multipart);
fastify.register(sensible, {
  "sharedSchemaId": 'HttpError',
});

const UPLOAD_PATH : string = process.env['UPLOAD_PATH'] ?? "";

try {
  if (!UPLOAD_PATH) {
    throw "please set a UPLOAD_PATH on your environment variables";
  }

  await fsPromises.access(UPLOAD_PATH, fsPromises.constants.R_OK | fsPromises.constants.W_OK);
} catch (err) {
  console.error("Couldn't get access to the UPLOAD_PATH: ", err);
  process.exit(1);
}

const uploadPathJoin = path.join.bind(null, UPLOAD_PATH);

fastify.register(fastifyStatic, {
  root: UPLOAD_PATH,
  prefix: '/files/',
})

fastify.get('/files', async (_request, _reply) => {
  const files = await fsPromises.readdir(UPLOAD_PATH)
  return files
});

fastify.post('/save', async (request, reply) => {
  const data = await request.file();
  if (!data) {
    return reply.badRequest;
  }
  let fileName = uploadPathJoin(data.filename);
  try {
    await fsPromises.access(fileName, fsPromises.constants.F_OK);
    // The file being uploaded already exists, writing a copy
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    fileName = `${base}.${randomUUID()}${ext}`;
  } catch (_) {
    // Don't do anything, file doesn't exist, creating a new one
  }
  await pipeline(data.file, createWriteStream(fileName));
  appNotify(`File Uploaded: ${fileName}`)
  return {status: 'ok'};
});

try {
  appNotify("Ready to run");
  await fastify.listen({port: PORT});
} catch (err) {
  fastify.log.error(err);
  appNotify("Server Crashed");
  process.exit(1); // look up what process exiting with 1 means
}
