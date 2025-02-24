import { createServer } from "http";
import { fork } from "child_process";

const startServices = async () => {
  // Start web server
  const webServer = fork("index.js", [], {
    stdio: "inherit",
  });

  // Start WhatsApp bot with proper Node.js flags
  const whatsappBot = fork("whatsapp-bot.js", [], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_NO_WARNINGS: "1",
    },
  });

  // Handle process exits
  webServer.on("exit", (code) => {
    console.log(`🚪 Web server exited with code ${code}`);
  });

  whatsappBot.on("exit", (code) => {
    console.log(`🤖 WhatsApp bot exited with code ${code}`);
  });
};

startServices();
