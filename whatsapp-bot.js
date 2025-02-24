import express from "express";
import pkg from "maher-zubair-baileys";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";

import nodemailer from "express";

// Add email configuration
const emailConfig = {
  service: "gmail",
  auth: {
    user: "vykanand@gmail.com",
    pass: "brqj ftms ktah jyqk",
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
const { makeWASocket, useMultiFileAuthState } = pkg;

let sock = null;
let isConnected = false;
const userOrders = new Map();
const userOrderState = new Map();

const menuItems = {
  1: { name: "CHICKEN SEEKH KEBAB - QTR(1PC)", price: 59 },
  2: { name: "TANDOORI CHICKEN - QTR(2PC)", price: 89 },
  3: { name: "CHICKEN TIKKA - HALF(8PC)", price: 149 },
};

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ["Linux", "Chrome", "1.0.0"],
    version: [2, 2424, 6],
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      // Create QR code image
      const qrImage = await QRCode.toDataURL(qr);

      // Send email with QR code
      const transporter = nodemailer.createTransport(emailConfig);
      await transporter.sendMail({
        from: "your-email@gmail.com",
        to: "vykanand@gmail.com",
        subject: "TandoorBaaz Bot - New Login QR Code",
        html: `<h2>Scan this QR code to reconnect the bot</h2>`,
        attachments: [
          {
            filename: "qr-code.png",
            content: qrImage.split("base64,")[1],
            encoding: "base64",
          },
        ],
      });

      console.log("📧 QR code sent to email");
    }

    if (connection === "open") {
      isConnected = true;
      console.log("✅ Connection established!");

      sock.ev.on("messages.upsert", async ({ messages }) => {
        const message = messages[0];
        const userNumber = message.key.remoteJid.split("@")[0];
        const userResponse =
          message.message?.conversation?.toLowerCase() ||
          message.message?.extendedTextMessage?.text?.toLowerCase();

        // Debug logging for all messages
        console.log("🔍 Message Debug:", {
          content: userResponse,
          fromMe: message.key.fromMe,
          number: userNumber,
          state: userOrderState.get(userNumber),
        });

        // Skip empty messages but allow all numbers including yours
        if (!userResponse) {
          console.log("📝 Skipping empty message");
          return;
        }

        // Process all valid messages regardless of source
        console.log(`📩 Processing message: ${userResponse}`);
        console.log(`🔄 Current state: ${userOrderState.get(userNumber)}`);

        if (!userResponse) {
          console.log("⚠️ Invalid message format");
          return;
        }

        console.log(`📩 User Input: ${userResponse}`);
        console.log(`🔄 Order State: ${userOrderState.get(userNumber)}`);

        // Handle initial greeting
        if (
          userResponse === "hello" ||
          userResponse === "menu" ||
          userResponse === "order"
        ) {
          userOrderState.set(userNumber, "awaitingMenuChoice");
          const welcomeMessage = `Welcome to Tandoorbaaz! 🔥
Our Menu:
1. CHICKEN SEEKH KEBAB - QTR(1PC) - ₹59
2. TANDOORI CHICKEN - QTR(2PC) - ₹89
3. CHICKEN TIKKA - HALF(8PC) - ₹149

Reply with item number to select (e.g. "2" for TANDOORI CHICKEN)`;
          await sock.sendMessage(message.key.remoteJid, {
            text: welcomeMessage,
          });
          return;
        }

        // Handle menu selection
        if (
          userOrderState.get(userNumber) === "awaitingMenuChoice" &&
          /^[1-3]$/.test(userResponse)
        ) {
          const selectedItem = menuItems[userResponse];
          userOrders.set(userNumber, userResponse);
          userOrderState.set(userNumber, "awaitingQuantity");

          console.log(
            `🛒 Selected menu item ${userResponse}: ${selectedItem.name}`
          );

          await sock.sendMessage(message.key.remoteJid, {
            text: `You selected: ${selectedItem.name}\nPrice: ₹${selectedItem.price}\n\nHow many would you like to order? Reply with quantity.`,
          });
          return;
        }

        // Handle quantity input
        if (
          userOrderState.get(userNumber) === "awaitingQuantity" &&
          /^\d+$/.test(userResponse)
        ) {
          const quantity = parseInt(userResponse);
          const selectedItemId = userOrders.get(userNumber);
          const item = menuItems[selectedItemId];
          const total = item.price * quantity;

          console.log(`📦 Processing order - Quantity: ${quantity}`);

          const order = {
            id: Date.now(),
            items: [
              {
                id: parseInt(selectedItemId),
                name: item.name,
                price: item.price,
                quantity: quantity,
              },
            ],
            total: total,
            timestamp: new Date().toISOString(),
            customerDetails: {
              phone: userNumber,
              orderTime: new Date().toLocaleString("en-IN"),
            },
            createdAt: new Date().toISOString(),
            status: "confirmed",
          };

          // Save order
          const ordersFile = path.join(__dirname, "./orders.json");
          let orders = [];
          if (fs.existsSync(ordersFile)) {
            orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
          }
          orders.push(order);
          fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

          // Send confirmation
          await sock.sendMessage(message.key.remoteJid, {
            text: `Order Confirmed! ✅\nOrder ID: ${order.id}\nItem: ${item.name}\nQuantity: ${quantity}\nTotal: ₹${total}\n\n 📞\nThank you for ordering from Tandoorbaaz! 🙏`,
          });

          // Add this after order confirmation message

          const paymentWebUrl = `https://tandoor-pay212.tiiny.site/?amount=${total}&orderId=${order.id}`;

          await sock.sendMessage(message.key.remoteJid, {
            text: `Click here to pay ₹${total}: ${paymentWebUrl}\n\nChoose your preferred payment app 📱 and Make the payment! 💰`,
          });

          // Reset user state
          userOrderState.delete(userNumber);
          userOrders.delete(userNumber);
          return;
        }
      });
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

const PORT = 3010;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectToWhatsApp();
});
