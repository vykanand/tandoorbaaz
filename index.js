import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

// Define __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the base public directory
const publicDir = path.join(__dirname, "public");

app.use(express.json());

// Read all directories under /public and serve them
fs.readdirSync(publicDir).forEach((dir) => {
  const dirPath = path.join(publicDir, dir);

  if (fs.statSync(dirPath).isDirectory()) {
    const route = `/${dir}/*`; // Wildcard route to catch all paths under directory
    console.log(`Serving ${dir} with query params support at ${route}`);

    app.get(route, (req, res) => {
      // Query params are automatically available in req.query
      const filePath = path.join(dirPath, "index.html");
      res.sendFile(filePath);
    });

    // Serve static assets from the directory
    app.use(`/${dir}`, express.static(dirPath));
  }
});

app.get("/api/orders/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.add(res);
  req.on("close", () => clients.delete(res));
});

// Get all orders
app.get("/api/orders", (req, res) => {
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

// Get single order
app.get("/api/orders/:id", (req, res) => {
  const ordersFile = path.join(__dirname, "orders.json");
  const orderId = req.params.id;

  try {
    const orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    const order = orders.find((o) => o.id == orderId);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create order
app.post("/api/orders", async (req, res) => {
  const ordersFile = path.join(__dirname, "orders.json");
  const order = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  try {
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      const fileContent = fs.readFileSync(ordersFile, "utf8");
      orders = fileContent ? JSON.parse(fileContent) : [];
    }
    orders.push(order);
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

// Update order
app.put("/api/orders/:id", (req, res) => {
  const ordersFile = path.join(__dirname, "orders.json");
  const orderId = req.params.id;

  try {
    let orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    const orderIndex = orders.findIndex((o) => o.id == orderId);

    if (orderIndex !== -1) {
      orders[orderIndex] = { ...orders[orderIndex], ...req.body };
      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
      res.json({ success: true, order: orders[orderIndex] });
    } else {
      res.status(404).json({ success: false, message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete order
app.delete("/api/orders/:id", (req, res) => {
  const ordersFile = path.join(__dirname, "orders.json");
  const orderId = req.params.id;

  try {
    let orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    orders = orders.filter((o) => o.id != orderId);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/", (req, res) => {
  // Query params accessible via req.query
  res.sendFile(path.join(__dirname, "./public/buy/index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
