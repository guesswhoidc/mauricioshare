import notifier from 'node-notifier';
import { APP_NAME } from "./config.ts";
import { exec } from 'node:child_process';

if (!process.env['NOTIFY']) {
  console.info("Set the environment variable NOTIFY=true to get desktop notifications");
}
export function appNotify(message : string) {
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
