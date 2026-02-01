import { app, startPromise } from '../server/index.js';

export default async (req: any, res: any) => {
    await startPromise;
    app(req, res);
};
