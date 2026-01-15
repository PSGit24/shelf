const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Collection = require('../models/Collection');

const PUBLIC_COLLECTIONS = [
  { category: "🚀 STARTUPS", name: "Startups", emoji: "🚀", count: 124, description: "CURATED LIST OF TOP SAAS TOOLS.", isPublic: true },
  { category: "🛠️ DEV TOOLS", name: "Dev Tools", emoji: "🛠️", count: 89, description: "MODERN OVERRIDES FOR WEB DEV.", isPublic: true },
  { category: "🎨 DESIGN", name: "Design", emoji: "🎨", count: 56, description: "PREMIUM ASSETS AND INSPIRATION.", isPublic: true },
  { category: "🧠 AI MODELS", name: "AI Models", emoji: "🧠", count: 210, description: "LATEST LARGE LANGUAGE MODELS.", isPublic: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const data of PUBLIC_COLLECTIONS) {
      const exists = await Collection.findOne({ category: data.category });
      if (!exists) {
        await Collection.create(data);
        console.log(`Created: ${data.category}`);
      } else {
        console.log(`Exists: ${data.category}`);
        // Optional: Update description if needed
        exists.description = data.description;
        exists.emoji = data.emoji;
        exists.count = data.count; // Keep hardcoded count for now as placeholder
        await exists.save();
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
