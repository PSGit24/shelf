const mongoose = require('mongoose');
const Link = require('../models/Link');
const Collection = require('../models/Collection');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const migrate = async () => {
  await connectDB();
  console.log("Starting Migration...");

  // 1. Fetch all links that don't have a collectionId yet
  const links = await Link.find({ collectionId: { $exists: false } });
  console.log(`Found ${links.length} legacy links to migrate.`);

  // 2. Group by User + Category Name
  const map = {}; // "userId_categoryName" -> { userId, categoryName, icon, isPublic }

  for (const link of links) {
    const key = `${link.userId}_${link.category}`;
    if (!map[key]) {
      map[key] = {
        userId: link.userId,
        name: link.category || "Uncategorized",
        icon: link.icon || "📁", // Best effort icon
        isPublic: link.isPublic
      };
    }
  }

  // 3. Create Collections & Update Links
  for (const key of Object.keys(map)) {
    const data = map[key];
    
    // Check if collection already exists (idempotency)
    let collection = await Collection.findOne({ owner: data.userId, name: data.name });
    
    if (!collection) {
      console.log(`Creating Collection: "${data.name}" for User: ${data.userId}`);
      try {
        collection = await Collection.create({
          name: data.name,
          owner: data.userId,
          isPublic: data.isPublic,
          icon: data.icon
        });
      } catch (e) {
        console.error(`Failed to create collection ${data.name}:`, e.message);
        continue;
      }
    }

    // Update all matching links
    const res = await Link.updateMany(
      { userId: data.userId, category: data.name },
      { $set: { collectionId: collection._id } }
    );
    console.log(`Updated ${res.modifiedCount} links for collection "${data.name}"`);
  }

  console.log("Migration Complete.");
  process.exit();
};

migrate();
