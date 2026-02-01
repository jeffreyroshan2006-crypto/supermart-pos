import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

// Simple logging middleware for Vercel
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`${req.method} ${req.path}`);
    }
    next();
});

const startPromise = registerRoutes(httpServer, app);

export default async (req: any, res: any) => {
    await startPromise;
    app(req, res);
};
