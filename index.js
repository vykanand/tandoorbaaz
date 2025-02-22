const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 3000;

// Define the base public directory
const publicDir = path.join(__dirname, "public");

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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
