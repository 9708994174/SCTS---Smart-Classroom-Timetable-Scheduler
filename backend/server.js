const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL, // Vercel frontend URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
