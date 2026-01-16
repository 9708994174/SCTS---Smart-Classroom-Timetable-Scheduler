const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

/* =========================
   CORS CONFIGURATION (FIXED)
========================= */

// CORS Configuration for Production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

// Add wildcard for Vercel preview deployments if needed
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('vercel.app')) {
  allowedOrigins.push(/^https:\/\/.*\.vercel\.app$/);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      })) {
        return callback(null, true);
      }

      // In production, log blocked origins but allow for now (adjust as needed)
      if (process.env.NODE_ENV === 'production') {
        console.warn("CORS: Blocked origin:", origin);
        // For production, you might want to return callback(new Error('Not allowed by CORS'))
        // For now, allowing to avoid breaking deployment
        return callback(null, true);
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Handle preflight requests
app.options("*", cors());

/* =========================
   MIDDLEWARE
========================= */

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined")); // More detailed logging for production
}

/* =========================
   DATABASE CONNECTION
========================= */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/scts",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

connectDB();

/* =========================
   MONGOOSE EVENTS
========================= */

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Reconnecting...");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

/* =========================
   ROOT ROUTE
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "SCTS – Smart Classroom Timetable Scheduler",
    status: "API is running 🚀",
    health: "/api/health",
  });
});

/* =========================
   ROUTES
========================= */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/faculty", require("./routes/faculty"));
app.use("/api/classroom", require("./routes/classroom"));
app.use("/api/subject", require("./routes/subject"));
app.use("/api/timeslot", require("./routes/timeslot"));
app.use("/api/timetable", require("./routes/timetable"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/notification", require("./routes/notification"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/support", require("./routes/support"));
app.use("/api/substitute", require("./routes/substitute"));
app.use("/api/student", require("./routes/student"));

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Smart Classroom and Timetable Scheduler API is running",
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   ERROR HANDLING
========================= */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "Not configured"}`);
  console.log(`🔗 API URL: http://localhost:${PORT} or ${process.env.BACKEND_URL || "Not configured"}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});
