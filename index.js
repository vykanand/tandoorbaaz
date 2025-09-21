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
const menuFile = path.join(publicDir, "buy", "menu.json");

app.use(express.json());

// Read all directories under /public and serve them
fs.readdirSync(publicDir).forEach((dir) => {
  const dirPath = path.join(publicDir, dir);

  if (fs.statSync(dirPath).isDirectory()) {
    const route = `/${dir}/:page`; // Dynamic route to catch specific pages
    console.log(`Serving ${dir} at ${route}`);

    app.get(route, (req, res) => {
      const page = req.params.page;
      const filePath = path.join(dirPath, page);

      // Check if file exists before sending
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send("Page not found");
      }
    });

// Update inventory after reconciliation
app.post('/api/update-inventory', (req, res) => {
    try {
        const { ingredientsUsed } = req.body;
        console.log('Updating inventory with:', ingredientsUsed);
        
        // Read current menu data
        const menuData = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
        let inventoryUpdated = false;
        
        // Update each ingredient's stock
        for (const [ingId, usage] of Object.entries(ingredientsUsed)) {
            const ingredient = menuData.ingredients.find(i => i.id === ingId);
            if (ingredient && usage.totalUsed) {
                const currentStock = parseFloat(ingredient.currentStock) || 0;
                const used = parseFloat(usage.totalUsed) || 0;
                
                // Update stock level (ensure it doesn't go below 0)
                ingredient.currentStock = Math.max(0, currentStock - used);
                inventoryUpdated = true;
                
                console.log(`Updated ${ingredient.name}: ${currentStock} → ${ingredient.currentStock} ${ingredient.unit}`);
            }
        }
        
        // Save updated menu data if changes were made
        if (inventoryUpdated) {
            fs.writeFileSync(menuFile, JSON.stringify(menuData, null, 2), 'utf8');
            res.json({ 
                success: true, 
                message: 'Inventory updated successfully',
                updated: true
            });
        } else {
            res.json({ 
                success: true, 
                message: 'No inventory updates were needed',
                updated: false
            });
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update inventory',
            details: error.message 
        });
    }
});

// Menu data APIs (single source of truth: public/buy/menu.json)
app.get("/api/menu", (req, res) => {
  try {
    if (fs.existsSync(menuFile)) {
      const data = fs.readFileSync(menuFile, "utf8");
      const json = data ? JSON.parse(data) : {};
      res.json(json);
    } else {
      res.status(404).json({ message: "menu.json not found" });
    }
  } catch (error) {
    console.error("Error reading menu.json:", error);
    res.status(500).json({ message: "Failed to load menu.json", error: error.message });
  }
});

app.put("/api/menu", (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ success: false, message: "Invalid JSON body" });
    }
    // Optionally ensure required top-level keys exist
    const payload = {
      ...body,
    };
    fs.writeFileSync(menuFile, JSON.stringify(payload, null, 2), "utf8");
    res.json({ success: true, message: "menu.json saved" });
  } catch (error) {
    console.error("Error writing menu.json:", error);
    res.status(500).json({ success: false, message: "Failed to save menu.json", error: error.message });
  }
});

    // Keep static assets serving
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
  res.sendFile(path.join(__dirname, "./public/buy/index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
