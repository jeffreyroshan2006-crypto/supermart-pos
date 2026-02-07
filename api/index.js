import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app, startPromise } = require("../dist/index.cjs");

export default async (req, res) => {
  await startPromise;
  return app(req, res);
};
