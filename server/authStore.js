const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function createUser({ username, password }) {
  // Check duplicates
  const userExists = await User.findOne({ username });
  if (userExists) {
    throw new Error("Username already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    username,
    password: hashedPassword,
  });

  return {
    id: newUser._id,
    username: newUser.username,
    avatarUrl: newUser.avatarUrl,
    createdAt: newUser.createdAt
  };
}

async function findUser(username) {
  const user = await User.findOne({ username });
  return user;
}

async function verifyPassword(inputPassword, storedHash) {
  return await bcrypt.compare(inputPassword, storedHash);
}

async function updateUser(id, { password, avatarUrl }) {
  const updates = {};
  
  if (password) {
    updates.password = await bcrypt.hash(password, 10);
  }
  
  if (avatarUrl !== undefined) {
    updates.avatarUrl = avatarUrl;
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    id, 
    { $set: updates }, 
    { new: true } // Return updated document
  );
  
  if (!updatedUser) return null;

  return {
    id: updatedUser._id,
    username: updatedUser.username,
    avatarUrl: updatedUser.avatarUrl,
    createdAt: updatedUser.createdAt
  };
}

module.exports = { createUser, findUser, verifyPassword, updateUser };
