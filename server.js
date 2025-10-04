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
const reconciliationsFile = path.join(__dirname, 'reconciliations.json');

// Middleware
app.use(express.json());
app.use(express.static(publicDir));

// Function to get directory structure
function getDirectoryStructure(dir, base = '') {
    const result = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.join(base, item.name);
        
        if (item.isDirectory()) {
            result.push({
                name: item.name,
                path: relativePath,
                type: 'directory',
                children: getDirectoryStructure(fullPath, relativePath)
            });
        } else if (item.isFile() && (item.name.endsWith('.html') || item.name.endsWith('.htm'))) {
            result.push({
                name: item.name,
                path: relativePath,
                type: 'file',
                url: `/${relativePath.replace(/\\/g, '/')}`
            });
        }
    }
    
    return result;
}

// Redirect root to the cart page
app.get('/', (req, res) => {
    res.redirect('/buy/cart.html?cart=eros');
});

// Helper function to render directory structure as HTML
// function renderDirectory(structure, level = 0) {
//     if (!structure || structure.length === 0) {
//         return '<p class="text-muted">No files found</p>';
//     }
    
//     const items = structure.map(item => {
//         if (item.type === 'directory') {
//             const hasChildren = item.children && item.children.length > 0;
//             return `
//                 <div class="directory">
//                     <button class="btn btn-link p-0 text-start text-decoration-none toggle-dir" style="font-weight: 500;">
//                         <i class="bi bi-folder2-open dir-icon"></i> ${item.name}/
//                     </button>
//                     <div class="directory-content ms-3 mt-2">
//                         ${hasChildren ? renderDirectory(item.children, level + 1) : '<p class="text-muted">Empty directory</p>'}
//                     </div>
//                 </div>
//             `;
//         } else {
//             return `
//                 <li>
//                     <a href="${item.url}" target="_blank">
//                         <i class="bi bi-file-earmark-text file-icon"></i> ${item.name}
//                     </a>
//                 </li>
//             `;
//         }
//     }).join('');
    
//     return `<ul class="file-list">${items}</ul>`;
// }

// Ensure reconciliations file exists
if (!fs.existsSync(reconciliationsFile)) {
  fs.writeFileSync(reconciliationsFile, JSON.stringify([], null, 2));
}

// API Routes

// Menu endpoints
app.get("/api/menu", (req, res) => {
  try {
    if (fs.existsSync(menuFile)) {
      const menu = JSON.parse(fs.readFileSync(menuFile, "utf8"));
      res.json(menu);
    } else {
      res.json({ categories: [], items: [], ingredients: [] });
    }
  } catch (error) {
    console.error("Error reading menu:", error);
    res.status(500).json({ error: "Failed to load menu" });
  }
});

app.put("/api/menu", (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ success: false, message: "Invalid JSON body" });
    }
    
    fs.writeFileSync(menuFile, JSON.stringify(body, null, 2), "utf8");
    res.json({ success: true, message: "menu.json saved" });
  } catch (error) {
    console.error("Error writing menu.json:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save menu.json", 
      error: error.message 
    });
  }
});

// Reconciliation endpoints
app.get('/api/reconciliations', (req, res) => {
  try {
    const data = fs.readFileSync(reconciliationsFile, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading reconciliations:', error);
    res.status(500).json({ success: false, error: 'Failed to load reconciliations' });
  }
});

// Get reconciliation history (sorted by date, newest first)
app.get('/api/reconciliations/history', (req, res) => {
  try {
    const data = fs.readFileSync(reconciliationsFile, 'utf8');
    const reconciliations = JSON.parse(data);
    
    // Sort by timestamp in descending order (newest first)
    const sorted = [...reconciliations].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    res.json(sorted);
  } catch (error) {
    console.error('Error fetching reconciliation history:', error);
    res.status(500).json({ success: false, error: 'Failed to load reconciliation history' });
  }
});

// Get last reconciliation
app.get('/api/reconciliations/last', (req, res) => {
  try {
    const data = fs.readFileSync(reconciliationsFile, 'utf8');
    const reconciliations = JSON.parse(data);
    
    if (reconciliations.length === 0) {
      return res.json(null);
    }
    
    // Find the most recent reconciliation
    const lastReconciliation = reconciliations.reduce((latest, current) => {
      return (new Date(current.timestamp) > new Date(latest.timestamp)) ? current : latest;
    }, reconciliations[0]);
    
    res.json(lastReconciliation);
  } catch (error) {
    console.error('Error fetching last reconciliation:', error);
    res.status(500).json({ success: false, error: 'Failed to load last reconciliation' });
  }
});

app.get('/api/reconciliations/check', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Missing startDate or endDate' });
    }
    
    const reconciliations = JSON.parse(fs.readFileSync(reconciliationsFile, 'utf8'));
    const isReconciled = reconciliations.some(rec => 
      rec.startDate === startDate && rec.endDate === endDate
    );
    
    res.json({ isReconciled });
  } catch (error) {
    console.error('Error checking reconciliation:', error);
    res.status(500).json({ success: false, error: 'Failed to check reconciliation' });
  }
});

app.post('/api/reconciliations', (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Missing startDate or endDate' });
    }
    
    const reconciliations = JSON.parse(fs.readFileSync(reconciliationsFile, 'utf8'));
    const newReconciliation = {
      id: Date.now(),
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
      user: 'admin'
    };
    
    reconciliations.push(newReconciliation);
    fs.writeFileSync(reconciliationsFile, JSON.stringify(reconciliations, null, 2));
    
    res.status(201).json({ success: true, reconciliation: newReconciliation });
  } catch (error) {
    console.error('Error saving reconciliation:', error);
    res.status(500).json({ success: false, error: 'Failed to save reconciliation' });
  }
});

// Update inventory after reconciliation
app.post('/api/update-inventory', async (req, res) => {
  try {
    const { ingredientsUsed, startDate, endDate } = req.body;
    
    if (!ingredientsUsed || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: ingredientsUsed, startDate, or endDate' 
      });
    }
    
    // Check if already reconciled
    const reconciliations = JSON.parse(fs.readFileSync(reconciliationsFile, 'utf8'));
    const isReconciled = reconciliations.some(rec => 
      rec.startDate === startDate && rec.endDate === endDate
    );
    
    if (isReconciled) {
      return res.status(400).json({
        success: false,
        error: 'This date range has already been reconciled'
      });
    }
    
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
      }
    }
    
    if (inventoryUpdated) {
      // Save the updated menu data
      fs.writeFileSync(menuFile, JSON.stringify(menuData, null, 2));
      
      // Record the reconciliation
      const newReconciliation = {
        id: Date.now(),
        startDate,
        endDate,
        timestamp: new Date().toISOString(),
        user: 'admin'
      };
      
      reconciliations.push(newReconciliation);
      fs.writeFileSync(reconciliationsFile, JSON.stringify(reconciliations, null, 2));
      
      res.json({ 
        success: true, 
        message: 'Inventory updated and reconciliation recorded',
        updatedAt: newReconciliation.timestamp
      });
    } else {
      res.json({ 
        success: true, 
        message: 'No inventory updates were needed',
        updatedAt: new Date().toISOString()
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

// Order endpoints
const clients = new Set();

app.get("/api/orders/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.add(res);
  req.on("close", () => clients.delete(res));
});

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
    console.error("Error reading orders:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

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

app.post("/api/orders", (req, res) => {
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
    
    // Notify all connected clients
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify({ type: 'new_order', order })}\n\n`);
    });
    
    res.status(201).json({
      success: true,
      orderId: order.id,
      message: "Order saved successfully",
    });
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save order",
      error: error.message,
    });
  }
});

app.put("/api/orders/:id", (req, res) => {
  const ordersFile = path.join(__dirname, "orders.json");
  const orderId = req.params.id;
  const updates = req.body;

  try {
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      const fileContent = fs.readFileSync(ordersFile, "utf8");
      orders = fileContent ? JSON.parse(fileContent) : [];
    }

    const index = orders.findIndex((o) => o.id == orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
      
      // Notify all connected clients
      clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'update_order', order: orders[index] })}\n\n`);
      });
      
      res.json({ success: true, order: orders[index] });
    } else {
      res.status(404).json({ success: false, message: "Order not found" });
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
});

app.delete("/api/orders/:id", (req, res) => {
  const ordersFile = path.join(__dirname, "orders.json");
  const orderId = req.params.id;

  try {
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      const fileContent = fs.readFileSync(ordersFile, "utf8");
      orders = fileContent ? JSON.parse(fileContent) : [];
    }

    const index = orders.findIndex((o) => o.id == orderId);
    if (index !== -1) {
      const [deletedOrder] = orders.splice(index, 1);
      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
      
      // Notify all connected clients
      clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'delete_order', orderId })}\n\n`);
      });
      
      res.json({ success: true, message: "Order deleted" });
    } else {
      res.status(404).json({ success: false, message: "Order not found" });
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
});

// Serve static files for all other routes
app.get('*', (req, res, next) => {
  // Check if the requested file exists
  const requestedPath = path.join(publicDir, req.path);
  
  // If the requested path is a file and exists, serve it
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return res.sendFile(requestedPath);
  }
  
  // If the path doesn't exist, redirect to cart.html
  res.redirect('/buy/cart.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
