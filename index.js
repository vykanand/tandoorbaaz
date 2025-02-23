const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 3000;

// Define the base public directory
const publicDir = path.join(__dirname, "public");
app.use(express.json());

// Read all directories under /public and serve them
fs.readdirSync(publicDir).forEach((dir) => {
  const dirPath = path.join(publicDir, dir);

  // Only serve directories
  if (fs.statSync(dirPath).isDirectory()) {
    const route = `/${dir}`; // Dynamic route based on the folder name
    console.log(`Serving ${dir} at ${route}`);
    app.use(route, express.static(dirPath));
  }
});

// Catch-all route for undefined paths
app.get("*", (req, res) => {
  res.status(404).send("Website not found!");
});

app.get("/api/orders/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.add(res);
  req.on("close", () => clients.delete(res));
});


app.get("/api/orderlist", (req, res) => {
  const ordersFile = path.join(__dirname, "orders.json");
  try {
    if (fs.existsSync(ordersFile)) {
      const orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
      res.json(orders);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.log("Error reading orders:", error);
    res.json([]);
  }
});

app.post("/api/orders", async (req, res, next) => {
  const ordersFile = path.join(__dirname, "./orders.json");
  const order = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };

  try {
    // Read existing orders
    let orders = [];
    if (await fs.existsSync(ordersFile)) {
      const fileContent = fs.readFileSync(ordersFile, "utf8");
      orders = fileContent ? JSON.parse(fileContent) : [];
      console.log(orders);
    }

    // Append new order
    orders.push(order);

    // Write to file
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    res.status(200).json({
      success: true,
      orderId: order.id,
      message: "Order saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save order",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
