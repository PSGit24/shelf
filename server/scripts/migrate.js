const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Link = require("../models/Link");
const connectDB = require("../config/db");

dotenv.config({ path: path.join(__dirname, "../.env") });

const migrateData = async () => {
  await connectDB();

  try {
    // 1. Migrate Users
    const usersPath = path.join(__dirname, "../users.json");
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
      
      console.log(`Found ${usersData.length} users to migrate.`);
      
      for (const u of usersData) {
        const exists = await User.findOne({ username: u.username });
        if (!exists) {
          // We can't reuse the ID because Mongo uses ObjectIds, 
          // or we can force it but it's better to let Mongo generate IDs.
          // However, if links reference users, we need to map old IDs to new IDs.
          // For this simple app, links don't seem to have userId yet.
          await User.create({
            username: u.username,
            password: u.password, // Already hashed
            avatarUrl: u.avatarUrl
          });
          console.log(`Migrated user: ${u.username}`);
        } else {
          console.log(`User ${u.username} already exists.`);
        }
      }
    }

    // 2. Migrate Links
    const linksPath = path.join(__dirname, "../links.json");
    if (fs.existsSync(linksPath)) {
      const linksData = JSON.parse(fs.readFileSync(linksPath, "utf-8"));
      console.log(`Found ${linksData.length} links to migrate.`);

      for (const l of linksData) {
        // Build simple check to avoid duplicates (e.g. by url)
        const exists = await Link.findOne({ url: l.url });
        if (!exists) {
          await Link.create({
            title: l.title,
            url: l.url,
            category: l.category,
            notes: l.notes, // Map any existing fields
            // emoji is not in current json but might be extracted conceptually if we wanted
          });
          console.log(`Migrated link: ${l.title}`);
        } else {
            console.log(`Link ${l.url} already exists.`);
        }
      }
    }

    console.log("Migration completed successfully.");
    process.exit();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrateData();
