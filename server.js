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

function getBusinessDate() {
  const now = new Date();
  const resetHour = 5;
  const resetMinute = 30;

  const resetTime = new Date(now);
  resetTime.setHours(resetHour, resetMinute, 0, 0);

  if (now < resetTime) {
    now.setDate(now.getDate() - 1);
  }

  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

function getPeriod() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(5, 30, 0, 0);

  if (now < start) {
    start.setDate(start.getDate() - 1);
  }

  const diff = Math.floor((now - start) / 60000);
  return diff + 1;
}

function generateResult() {
  const businessDate = getBusinessDate();
  const period = getPeriod();
  const secret = "HACKII_SECURE_KEY";

  const seed = businessDate + period + secret;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");

  const number = parseInt(hash.substring(0, 8), 16) % 10;

  return number;
}

setInterval(() => {
  const seconds = new Date().getSeconds();

  if (seconds === 20) {
    lastResult = currentResult;
    currentResult = generateResult();
  }

  io.emit("update", {
    time: new Date(),
    currentResult,
    lastResult,
    period: getPeriod()
  });

}, 1000);

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
