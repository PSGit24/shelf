const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Old models
const Link = require('../models/Link');
const Collection = require('../models/Collection');

// New models
const PublicCollection = require('../models/PublicCollection');
const PublicLink = require('../models/PublicLink');
const UserCollection = require('../models/UserCollection');
const UserLink = require('../models/UserLink');

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
  console.log("Starting Schema Separation Migration...");

  // ----- MIGRATE PUBLIC COLLECTIONS -----
  console.log("\n--- Migrating Public Collections ---");
  const oldPublicCollections = await Collection.find({ isPublic: true });
  console.log(`Found ${oldPublicCollections.length} public collections to migrate.`);

  for (const old of oldPublicCollections) {
    try {
      const existing = await PublicCollection.findOne({ name: old.name });
      if (existing) {
        console.log(`  [SKIP] PublicCollection "${old.name}" already exists.`);
        continue;
      }
      await PublicCollection.create({
        name: old.name,
        icon: old.icon || old.emoji || "📁",
        description: old.description || ""
      });
      console.log(`  [OK] Created PublicCollection: ${old.name}`);
    } catch (err) {
      console.error(`  [ERR] Failed to create PublicCollection ${old.name}:`, err.message);
    }
  }

  // ----- MIGRATE PUBLIC LINKS -----
  console.log("\n--- Migrating Public Links ---");
  const oldPublicLinks = await Link.find({ isPublic: true }).populate('collectionId');
  console.log(`Found ${oldPublicLinks.length} public links to migrate.`);

  for (const old of oldPublicLinks) {
    const collName = old.collectionId?.name || old.category || "Uncategorized";
    const newColl = await PublicCollection.findOne({ name: collName });
    if (!newColl) {
      console.log(`  [SKIP] No PublicCollection found for link "${old.title}" (collection: ${collName})`);
      continue;
    }
    try {
      await PublicLink.create({
        title: old.title,
        url: old.url,
        notes: old.notes || "",
        icon: old.icon || "",
        collectionId: newColl._id
      });
      console.log(`  [OK] Created PublicLink: ${old.title}`);
    } catch (err) {
      console.error(`  [ERR] Failed to create PublicLink ${old.title}:`, err.message);
    }
  }

  // ----- MIGRATE USER COLLECTIONS -----
  console.log("\n--- Migrating User Collections ---");
  const oldUserCollections = await Collection.find({ isPublic: { $ne: true }, owner: { $exists: true } });
  console.log(`Found ${oldUserCollections.length} user collections to migrate.`);

  for (const old of oldUserCollections) {
    try {
      const existing = await UserCollection.findOne({ name: old.name, owner: old.owner });
      if (existing) {
        console.log(`  [SKIP] UserCollection "${old.name}" for user ${old.owner} already exists.`);
        continue;
      }
      await UserCollection.create({
        name: old.name,
        icon: old.icon || old.emoji || "📁",
        owner: old.owner
      });
      console.log(`  [OK] Created UserCollection: ${old.name} for user ${old.owner}`);
    } catch (err) {
      console.error(`  [ERR] Failed to create UserCollection ${old.name}:`, err.message);
    }
  }

  // ----- MIGRATE USER LINKS -----
  console.log("\n--- Migrating User Links ---");
  const oldUserLinks = await Link.find({ isPublic: { $ne: true } }).populate('collectionId');
  console.log(`Found ${oldUserLinks.length} user links to migrate.`);

  for (const old of oldUserLinks) {
    const collName = old.collectionId?.name || old.category || "Uncategorized";
    const newColl = await UserCollection.findOne({ name: collName, owner: old.userId });
    if (!newColl) {
      console.log(`  [SKIP] No UserCollection found for link "${old.title}" (collection: ${collName}, user: ${old.userId})`);
      continue;
    }
    try {
      await UserLink.create({
        title: old.title,
        url: old.url,
        notes: old.notes || "",
        icon: old.icon || "",
        collectionId: newColl._id,
        userId: old.userId
      });
      console.log(`  [OK] Created UserLink: ${old.title}`);
    } catch (err) {
      console.error(`  [ERR] Failed to create UserLink ${old.title}:`, err.message);
    }
  }

  console.log("\n--- Migration Complete ---");
  process.exit();
};

migrate();
