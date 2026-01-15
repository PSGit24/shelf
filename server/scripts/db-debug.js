const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("--- MongoDB Diagnostic Tool ---");
console.log("Node Version:", process.version);

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ Error: MONGO_URI is invalid or missing in .env");
  process.exit(1);
}

// Mask password for safe logging
const maskedUri = uri.replace(/:([^:@]+)@/, ":****@");
console.log(`Attempting to connect to: ${maskedUri}`);

// Parse URI to check for basic validity
try {
  const parsed = new URL(uri);
  console.log("✅ URI Format: Valid");
  console.log("   Protocol:", parsed.protocol);
  console.log("   Username:", parsed.username);
  // console.log("   Password:", parsed.password); // Don't log this
  console.log("   Host:", parsed.hostname);
} catch (e) {
  console.error("❌ URI Format Error:", e.message);
  console.log("   Tip: Check for unencoded special characters in your password.");
}

async function run() {
  try {
    console.log("Connecting...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ SUCCESS: Connected to MongoDB!");
    console.log("State:", mongoose.connection.readyState);
    await mongoose.disconnect();
    console.log("Disconnected.");
  } catch (err) {
    console.error("\n❌ CONNECTION FAILED:");
    console.error(err.message);
    console.error("\nTroubleshooting Tips:");
    if (err.message.includes("bad auth")) {
      console.log("1. Check your USERNAME in MongoDB Atlas.");
      console.log("2. Check your PASSWORD. If it has special chars like @, :, /, make sure they are URL encoded (e.g., @ -> %40).");
      console.log("   OR change your password to just letters and numbers.");
      console.log("3. Ensure the user exists in the 'Database Access' tab in Atlas.");
    } else if (err.message.includes("ENOTFOUND")) {
      console.log("1. Check if the CLUSTER URL is correct.");
      console.log("2. Check your internet connection.");
    } else if (err.message.includes("definition")) {
      console.log("1. IP Whitelist: Go to 'Network Access' in Atlas and add '0.0.0.0/0'.");
    }
  }
}

run();
