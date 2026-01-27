import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import { createWriteStream } from 'node:fs';
import fsPromises from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import notifier from 'node-notifier';
import {exec} from 'node:child_process';

const APP_NAME = process.env['APP_NAME'] ?? "APP_NAME";
const PORT = process.env['PORT'] ?? "3290";

function appNotify(message : string) {
  if (!process.env['NOTIFY']) {
    return;
  }
  console.log(`notify: ${APP_NAME}: ${message}`);
  if (process.env['NOTIFY'] === 'POPOS') {
    // Hack to show notifications on POPOS since the notifier dependency doesn't seem to work
    exec(`gdbus call --session --dest org.freedesktop.Notifications --object-path /org/freedesktop/Notifications --method org.freedesktop.Notifications.Notify "${APP_NAME}" 0 "" "${message.replace('"', "")}" "{}" '[]' '{"urgency": <1>}' 5000`)
    return
  }

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

fastify.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024,
  }
});
fastify.register(sensible, {
  "sharedSchemaId": 'HttpError',
});
fastify.register(cors, {origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']});

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

interface FileInfo {
  fileName: string,
  fileSize: number,
  createdAt: number
}

fastify.get('/files', async (_request, _reply) => {
  const files = await fsPromises.readdir(UPLOAD_PATH);
  const result : FileInfo[] = [];
  for(let fileName of files) {
    const stats = await fsPromises.stat(uploadPathJoin(fileName))
    result.push({
      fileName,
      fileSize: stats.size,
      createdAt: stats.birthtimeMs,
    });
  }
  return result.sort((a, b) => b.createdAt - a.createdAt);
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
    fileName = uploadPathJoin(`${base}.${randomUUID()}${ext}`);
  } catch (_) {
    // Don't do anything, file doesn't exist, creating a new one
  }
  await pipeline(data.file, createWriteStream(fileName));
  appNotify(`File Uploaded: ${fileName}`)
  return {status: 'ok'};
});

interface FileNameParams {
  fileName: string | null
}

fastify.delete('/delete/:fileName', async (request, reply) => {
  const params = request.params;

  if (typeof params !== 'object' || !params) return reply.badRequest();

  const requestFileName = (params as FileNameParams)['fileName'];

  if (typeof requestFileName !== 'string') return reply.badRequest();
  
  const fileName = uploadPathJoin(path.basename(requestFileName));
  try {
    await fsPromises.unlink(fileName);
    return {status: 'ok'};
  } catch (_err) {
    return reply.internalServerError(`Couldn't delete the file: ${requestFileName}`);
  }
})

try {
  appNotify("Ready to run");
  fastify.listen({port: PORT, host:'0.0.0.0'});
} catch (err) {
  fastify.log.error(err);
  appNotify("Server Crashed");
  process.exit(1); // look up what process exiting with 1 means
}
