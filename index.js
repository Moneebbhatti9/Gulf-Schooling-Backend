const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const port = 8000;
const cors = require("cors");
const cookieParser = require("cookie-parser");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://gulf-schooling-frontend-git-staging-moneebbhatti9s-projects.vercel.app",
    "https://gulf-schooling-frontend.vercel.app",
  ],
  credentials: true,
};

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
const connectDB = require("./db/connection");
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // or set your frontend URL
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

try {
  connectDB();
} catch (error) {
  console.log("DB Connection Error:", error);
}

// const School = require("./models/School/schoolModel");

const auth = require("./routes/auth");
const school = require("./routes/school/schoolRouter");
const teacher = require("./routes/teacher/teacherRouter");
const supplier = require("./routes/supplier/supplierRouter");
const allUsers = require("./routes/allUsers/allUsersRouter");
const jobs = require("./routes/jobs/jobsRouter");
const jobInsights = require("./routes/jobs/jobInsightsRouter");
const cv = require("./routes/teacher/teacherCVrouter");
const discussion = require("./routes/discussion/discussionRouter");
const reply = require("./routes/discussion/replyRouter");

app.use("/auth", auth);
app.use("/school", school);
app.use("/teacher", teacher);
app.use("/supplier", supplier);
app.use("/allUsers", allUsers);
app.use("/jobs", jobs);
app.use("/job-insights", jobInsights);
app.use("/cv", cv);
app.use("/discussion", discussion);
app.use("/reply", reply);

app.use((err, req, res, next) => {
  console.error(err); // so you see the full error in your console
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    // stack: err.stack  // include in dev if you like
  });
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.listen(port, () => {
  console.log(`server running on port : ${port}`);
});
