import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from './routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const httpServer = createServer(app);

// Simple logging middleware
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`${req.method} ${req.path}`);
    }
    next();
});

let routesPromise: Promise<any> | null = null;

export default async (req: any, res: any) => {
    // Health check can be standalone or through routes
    if (req.url === '/api/health' || req.url === '/api/health/') {
        return res.json({
            status: "ok",
            message: "Vercel bundled server is running",
            env: process.env.NODE_ENV
        });
    }

    if (!routesPromise) {
        routesPromise = registerRoutes(httpServer, app);
    }

    await routesPromise;
    app(req, res);
};
