// Vercel serverless API entry point
import { createServer } from "http";
import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import { registerRoutes } from "../server/routes";
import { setupAuth } from "../server/auth";

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "supermart-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
setupAuth(app);

// Register API routes
registerRoutes(createServer(app), app);

// Export for Vercel
export default app;
