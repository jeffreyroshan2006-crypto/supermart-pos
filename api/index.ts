import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes.js';

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

export default async (req: any, res: any) => {
    try {
        await registerRoutes(httpServer, app);
        app(req, res);
    } catch (err: any) {
        console.error("Vercel Entry Point Error:", err);
        res.status(500).json({
            error: "Vercel Entry Point Error",
            message: err.message,
            stack: err.stack
        });
    }
};
