
export const AppName = import.meta.env.VITE_APP_NAME ?? "APP_NAME";
export const FileServer = import.meta.env.VITE_FILESERVER_ADDRESS ?? "http://127.0.0.1:3290";

export function fileServerJoin(...args : string[]) : string {
  return [FileServer, ...args].join('/')
}

