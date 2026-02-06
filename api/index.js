// Vercel serverless API entry point
// This file serves as the entry point for Vercel serverless functions

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const { createServer } = require("http");

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
app.use(passport.initialize());
app.use(passport.session());

// Import and setup auth
const { setupAuth } = require("../dist/auth");
setupAuth(app);

// Import and register routes
const { registerRoutes } = require("../dist/routes");
registerRoutes(createServer(app), app);

// Export for Vercel
module.exports = app;
