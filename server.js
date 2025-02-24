import { createServer } from "http";
import { spawn, exec } from "child_process";

const killPorts = () => {
  return new Promise((resolve) => {
    const ports = [3000, 3010];
    let completed = 0;

    ports.forEach((port) => {
      exec(`lsof -ti:${port} | xargs kill -9`, () => {
        console.log(`🎯 Released port ${port}`);
        completed++;
        if (completed === ports.length) {
          // Wait a moment for ports to fully clear
          setTimeout(resolve, 1000);
        }
      });
    });
  });
};

const startServices = async () => {
  await killPorts();

  // Start web server with delay
  setTimeout(() => {
    spawn("node", ["index.js"], { stdio: "inherit" });
    console.log("🚀 Started web server on port 3000");
  }, 1500);

  // Start WhatsApp bot with delay
  setTimeout(() => {
    spawn("node", ["whatsapp-bot.js"], { stdio: "inherit" });
    console.log("🤖 Started WhatsApp bot on port 3010");
  }, 2000);
};

startServices();
