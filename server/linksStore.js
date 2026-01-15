const UserLink = require("./models/UserLink");
const UserCollection = require("./models/UserCollection");

// Helper to format mongo document
const formatLink = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  url: doc.url,
  category: doc.collectionId ? doc.collectionId.name : "Uncategorized",
  collectionId: doc.collectionId ? doc.collectionId._id.toString() : null,
  notes: doc.notes,
  createdAt: doc.createdAt,
  icon: doc.icon || (doc.collectionId ? doc.collectionId.icon : "")
});

async function getAllLinks(userId) {
  // Fetch all user's private collections
  const userCollections = await UserCollection.find({ owner: userId });
  const collectionIds = userCollections.map(c => c._id);
  console.log(`[DEBUG] getAllLinks - userId: ${userId}, collectionIds: ${collectionIds.length}`);
  
  // Fetch links in those collections
  const links = await UserLink.find({ collectionId: { $in: collectionIds } })
                              .populate('collectionId')
                              .sort({ createdAt: -1 });
  console.log(`[DEBUG] getAllLinks - returning ${links.length} links`);
  const formatted = links.map(formatLink);
  console.log(`[DEBUG] getAllLinks - sample:`, formatted.slice(0, 2).map(l => ({ title: l.title, icon: l.icon })));
  return formatted;
}

async function addLink({ title, url, category, notes, userId, icon }) {
  console.log(`[DEBUG] addLink - category: ${category}, icon: ${icon}`);
  
  // Find or create user collection
  let collection = await UserCollection.findOne({ name: category, owner: userId });
  if (!collection) {
    collection = await UserCollection.create({
      name: category,
      owner: userId,
      icon: icon || "📁"
    });
    console.log(`[DEBUG] Created new UserCollection: ${collection._id}`);
  }

  const newLink = await UserLink.create({
    title,
    url,
    notes: notes || "",
    icon: icon || "",
    collectionId: collection._id,
    userId
  });
  
  const populated = await newLink.populate('collectionId');
  const result = formatLink(populated);
  console.log(`[DEBUG] addLink - returning:`, { id: result.id, title: result.title, icon: result.icon, category: result.category });
  return result;
}

async function deleteLink(id) {
  console.log(`[DEBUG] deleteLink - id: ${id}`);
  const result = await UserLink.findByIdAndDelete(id);
  console.log(`[DEBUG] deleteLink - deleted: ${result ? 'yes' : 'no'}`);
  return { id };
}

async function updateLink(id, updates) {
  const updated = await UserLink.findByIdAndUpdate(id, updates, { new: true }).populate('collectionId');
  if (!updated) throw new Error("Link not found");
  return formatLink(updated);
}

async function renameCategory(oldName, newName, userId) {
  await UserCollection.findOneAndUpdate(
    { name: oldName, owner: userId },
    { $set: { name: newName } }
  );
  return { success: true };
}

async function deleteCategory(categoryName, userId) {
  const collection = await UserCollection.findOne({ name: categoryName, owner: userId });
  if (collection) {
    await UserLink.deleteMany({ collectionId: collection._id });
    await UserCollection.findByIdAndDelete(collection._id);
  }
  return { success: true };
}

module.exports = { 
  getAllLinks, 
  addLink, 
  deleteLink, 
  updateLink, 
  renameCategory, 
  deleteCategory 
};
