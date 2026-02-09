import { app, initializeApp } from "../server/app";

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await initializeApp();
    initialized = true;
  }
  return app(req, res);
}
