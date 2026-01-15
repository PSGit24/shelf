const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PublicCollection = require('../models/PublicCollection');
const PublicLink = require('../models/PublicLink');

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

const seed = async () => {
  await connectDB();
  console.log("Seeding Public Collections...");

  const collections = [
    { name: "Startups", icon: "🚀", description: "Startup resources and tools" },
    { name: "Dev Tools", icon: "💻", description: "Developer tools and utilities" },
    { name: "Design", icon: "🎨", description: "Design resources and inspiration" },
    { name: "AI Models", icon: "🤖", description: "AI models and machine learning" }
  ];

  for (const c of collections) {
    const exists = await PublicCollection.findOne({ name: c.name });
    if (exists) {
      console.log(`  [SKIP] ${c.name} already exists`);
      continue;
    }
    const coll = await PublicCollection.create(c);
    console.log(`  [OK] Created: ${c.name}`);

    // Add sample links
    const links = [
      { title: `${c.name} Resource 1`, url: `https://example.com/${c.name.toLowerCase().replace(' ', '-')}/1`, notes: "Sample link" },
      { title: `${c.name} Resource 2`, url: `https://example.com/${c.name.toLowerCase().replace(' ', '-')}/2`, notes: "Sample link" }
    ];
    for (const l of links) {
      await PublicLink.create({ ...l, icon: c.icon, collectionId: coll._id });
      console.log(`    [OK] Link: ${l.title}`);
    }
  }

  console.log("Seeding complete.");
  process.exit();
};

seed();
