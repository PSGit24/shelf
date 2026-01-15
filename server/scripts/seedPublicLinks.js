const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Link = require('../models/Link');
const User = require('../models/User');

const PUBLIC_LINKS = [
  // --- STARTUPS ---
  {
    title: "Y Combinator",
    url: "https://www.ycombinator.com",
    category: "🚀 STARTUPS",
    notes: "Startup accelerator and funding.",
    isPublic: true
  },
  {
    title: "Vercel",
    url: "https://vercel.com",
    category: "🚀 STARTUPS",
    notes: "Develop. Preview. Ship.",
    isPublic: true
  },
  {
    title: "Stripe",
    url: "https://stripe.com",
    category: "🚀 STARTUPS",
    notes: "Financial infrastructure for the internet.",
    isPublic: true
  },
  
  // --- DEV TOOLS ---
  {
    title: "GitHub",
    url: "https://github.com",
    category: "🛠️ DEV TOOLS",
    notes: "Where the world builds software.",
    isPublic: true
  },
  {
    title: "Visual Studio Code",
    url: "https://code.visualstudio.com",
    category: "🛠️ DEV TOOLS",
    notes: "Code editing. Redefined.",
    isPublic: true
  },
  {
    title: "Stack Overflow",
    url: "https://stackoverflow.com",
    category: "🛠️ DEV TOOLS",
    notes: "Public platform for building the definitive collection of coding questions & answers.",
    isPublic: true
  },

  // --- DESIGN ---
  {
    title: "Figma",
    url: "https://www.figma.com",
    category: "🎨 DESIGN",
    notes: "The collaborative interface design tool.",
    isPublic: true
  },
  {
    title: "Dribbble",
    url: "https://dribbble.com",
    category: "🎨 DESIGN",
    notes: "Discover the world’s top designers & creative professionals.",
    isPublic: true
  },
  {
    title: "Behance",
    url: "https://www.behance.net",
    category: "🎨 DESIGN",
    notes: "Showcase & discover creative work.",
    isPublic: true
  },

  // --- AI MODELS ---
  {
    title: "OpenAI",
    url: "https://openai.com",
    category: "🧠 AI MODELS",
    notes: "Creating safe AGI that benefits all of humanity.",
    isPublic: true
  },
  {
    title: "Hugging Face",
    url: "https://huggingface.co",
    category: "🧠 AI MODELS",
    notes: "The AI community building the future.",
    isPublic: true
  },
  {
    title: "Anthropic",
    url: "https://www.anthropic.com",
    category: "🧠 AI MODELS",
    notes: "AI research and deployment company.",
    isPublic: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a system user or create one to assign these links to
    let adminUser = await User.findOne({ username: 'system_admin' });
    if (!adminUser) {
        // Fallback to first user if system_admin doesn't exist, or create one
        // For simplicity, let's try to find ANY user to assign ownership for internal consistency
        // Ideally, we should have a dedicated admin account.
        const anyUser = await User.findOne({});
        if (anyUser) {
            adminUser = anyUser;
            console.log(`Using existing user ${adminUser.username} as public link owner.`);
        } else {
             console.log("No users found. Creating temporary system admin.");
             // Create a dummy user just for seeding (password hash would be needed in real app but strict validation might be bypassed here directly via model if not careful, 
             // but let's assume we need a valid doc. 
             // Actually, let's just create one properly if possible or fail if no user logic exists.
             // Given I don't want to mess up auth, I will skip user creation if I can't find one, 
             // BUT schema requires user.
             // Let's create a placeholder link owner.
             adminUser = await User.create({ username: "shelf_system", password: "system_password_hash_placeholder" });
        }
    }

    // Delete existing PUBLIC links to avoid duplicates upon re-seed
    await Link.deleteMany({ isPublic: true });
    console.log("Cleared existing public links.");

    const linksWithUser = PUBLIC_LINKS.map(link => ({
        ...link,
        userId: adminUser._id
    }));

    await Link.insertMany(linksWithUser);
    console.log(`Seeded ${linksWithUser.length} public links.`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
