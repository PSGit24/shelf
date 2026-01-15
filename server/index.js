const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require('./models/User');
const PublicCollection = require('./models/PublicCollection');
const PublicLink = require('./models/PublicLink');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// GET Public Collections


const { getAllLinks, addLink, deleteLink, updateLink, renameCategory, deleteCategory } = require("./linksStore");

const app = express();
const PORT = process.env.PORT || 4000;

// Allow all origins in development (more flexible)
app.use(cors({
  origin: true, // Allow any origin in development
  credentials: true,
}));
app.use(express.json());

const jwt = require("jsonwebtoken");
const { createUser, findUser, verifyPassword, updateUser } = require("./authStore");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_in_prod";

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token." });
    req.user = user;
    next();
  });
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET Public Collections
app.get('/api/collections/public', async (req, res) => {
  try {
    const collections = await PublicCollection.find();
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Links for a specific Public Collection
app.get('/api/collections/public/:category/links', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`[DEBUG] GET Public Content for category: '${category}'`);
    
    const collection = await PublicCollection.findOne({ name: category });
    if (!collection) {
      return res.json([]);
    }
    
    const links = await PublicLink.find({ collectionId: collection._id }).sort({ createdAt: -1 });
    console.log(`[DEBUG] Found ${links.length} public links for '${category}'`);

    const formattedLinks = links.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      url: doc.url,
      category: collection.name,
      notes: doc.notes,
      icon: doc.icon || collection.icon,
      createdAt: doc.createdAt
    }));
    
    res.json(formattedLinks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch public links for this collection" });
  }
});

// Get all links
app.get("/api/links", authenticateToken, async (req, res) => {
  try {
    const links = await getAllLinks(req.user.id);
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch links" });
  }
});



// --- Auth Routes ---

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Create new user
    const user = await createUser({ username, password });
    
    // Generate token
    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await findUser(username);
    
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ username: user.username, id: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { username: user.username, id: user._id, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// --- Protected Routes (Apply authenticateToken) ---

app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, avatarUrl } = req.body;
    const userId = req.user.id;
    
    // Check user exists and verify password if changing it
    const user = await findUser(req.user.username); // using username from token to finding full user record
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate Password Change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password." });
      }
      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Incorrect current password." });
      }
    }

    // Update User
    const updatedUser = await updateUser(userId, { 
      password: newPassword, // updateUser handles hashing
      avatarUrl 
    });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Add a new link
app.post("/api/links", authenticateToken, async (req, res) => {
  const { title, url, category, notes, isPublic, icon } = req.body || {};
  console.log(`[DEBUG] POST /api/links - title: ${title}, category: ${category}, isPublic: ${isPublic}, icon: ${icon}`);

  if (!title || !url) {
    return res.status(400).json({ message: "Title and URL are required." });
  }

  try {
    if (isPublic) {
      // Add to PUBLIC collection
      let collection = await PublicCollection.findOne({ name: category });
      if (!collection) {
        collection = await PublicCollection.create({ name: category, icon: icon || "📁" });
      }
      const newLink = await PublicLink.create({
        title,
        url,
        notes: notes || "",
        icon: icon || "",
        collectionId: collection._id
      });
      res.status(201).json({
        id: newLink._id.toString(),
        title: newLink.title,
        url: newLink.url,
        category: collection.name,
        notes: newLink.notes,
        icon: newLink.icon,
        createdAt: newLink.createdAt,
        isPublic: true
      });
    } else {
      // Add to PRIVATE collection (uses linksStore)
      const newLink = await addLink({
        title,
        url,
        category,
        notes,
        userId: req.user.id,
        icon
      });
      res.status(201).json(newLink);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add link" });
  }
});

// Update a link
app.put("/api/links/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, url, category, notes, icon } = req.body;
  
  try {
    const updatedLink = await updateLink(id, { title, url, category, notes, icon });
    if (updatedLink) {
      res.json(updatedLink);
    } else {
      res.status(404).json({ message: "Link not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to update link" });
  }
});

// Rename a collection
app.put("/api/collections/:name", authenticateToken, async (req, res) => {
  const oldName = req.params.name;
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).json({ message: "New name is required" });
  }

  const result = await renameCategory(oldName, newName, req.user.id);
  res.json(result);
});

// Delete a collection
app.delete("/api/collections/:name", authenticateToken, (req, res) => { // PROTECTED
  const { name } = req.params;
  console.log(`[DEBUG] Delete Collection request: '${name}' by user ${req.user.id}`);

  const deleted = deleteCategory(name, req.user.id);
  console.log(`[DEBUG] Delete result: deleted=${deleted}`);

  if (!deleted) {
      // It's possible the collection was already empty or didn't exist
      return res.status(404).json({ message: "Collection not found" });
  }
  res.status(204).send();
});

// Delete a link
app.delete("/api/links/:id", authenticateToken, (req, res) => { // PROTECTED
  const { id } = req.params;
  const deleted = deleteLink(id);
  if (deleted) {
    res.status(204).send();
  } else {
    res.status(404).json({ message: "Link not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
