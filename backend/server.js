require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");

const searchRouter = require("./routes/search");
const chatRouter = require("./routes/chat");
const healthRouter = require("./routes/health");
const testGroqRouter = require("./routes/testGroq");

const app = express();

// ---------------------------------------------------------------------------
// CORS — allow Vercel frontend + localhost during development
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL, // e.g. https://tripsmart.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/search", searchRouter);
app.use("/api/chat", chatRouter);
app.use("/api/health", healthRouter);
app.use("/api/test-groq", testGroqRouter);

// Root endpoint for Render health checks
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "TripSmart API" });
});

// ---------------------------------------------------------------------------
// Start server — Render provides PORT via environment variable
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✈️  TripSmart API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
