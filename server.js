const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

let currentResult = null;
let lastResult = null;

// ✅ Get India Time (IST)
function getIST() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

// ✅ Business Date (5:30 AM Reset IST)
function getBusinessDate() {
  const now = getIST();
  const reset = new Date(now);
  reset.setHours(5, 30, 0, 0);

  if (now < reset) {
    reset.setDate(reset.getDate() - 1);
  }

  return reset.toISOString().slice(0, 10).replace(/-/g, "");
}

// ✅ Correct Period Logic (IST Based)
function getPeriod() {
  const now = getIST();
  const start = new Date(now);
  start.setHours(5, 30, 0, 0);

  if (now < start) {
    start.setDate(start.getDate() - 1);
  }

  const diffMinutes = Math.floor((now - start) / 60000);
  return diffMinutes + 1;
}

// ✅ Secure Result Generation
function generateResult() {
  const businessDate = getBusinessDate();
  const period = getPeriod();
  const secret = "HACKII_SECURE_KEY";

  const seed = businessDate + period + secret;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");

  return parseInt(hash.substring(0, 8), 16) % 10;
}

// ✅ Live Engine
setInterval(() => {
  const now = getIST();
  const seconds = now.getSeconds();

  // 20th second preview lock
  if (seconds === 20) {
    lastResult = currentResult;
    currentResult = generateResult();
  }

  const period = getPeriod();
  const roundId =
    getBusinessDate() +
    "10001" +
    String(period).padStart(4, "0");

  io.emit("update", {
    time: now,
    currentResult,
    lastResult,
    period,
    roundId
  });

}, 1000);

server.listen(PORT, () => {
  console.log("HACKII Server Running (IST Mode) on port " + PORT);
});
