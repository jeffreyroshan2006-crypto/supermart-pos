import express from 'express';
import { createServer } from 'http';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

export default async (req: any, res: any) => {
    // 1. Standalone Health Check (No dependencies to ensure it boots)
    if (req.url === '/api/health' || req.url === '/api/health/') {
        return res.json({
            status: "ok",
            message: "Vercel function is running",
            env: process.env.NODE_ENV,
            db_configured: !!(process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        });
    }

    try {
        // 2. Lazy load the rest of the app
        const { registerRoutes } = await import('../server/routes.js');
        await registerRoutes(httpServer, app);
        app(req, res);
    } catch (err: any) {
        console.error("Vercel Execution Error:", err);
        res.status(500).json({
            error: "Vercel Execution Error",
            message: err.message,
            tip: "Check if all files are pushed to GitHub",
            path: req.url
        });
    }
};
