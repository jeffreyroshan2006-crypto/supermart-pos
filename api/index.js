// Vercel serverless API entry point
// This file serves as the entry point for Vercel serverless functions
// It simply loads the bundled server and exports the Express app

const { app, startPromise } = require("../dist/index.cjs");

// We export the app as a function to ensure it's handled as a serverless function
module.exports = async (req, res) => {
  // Ensure routes are registered
  await startPromise;
  return app(req, res);
};
