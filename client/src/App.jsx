import { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tab,
  Tabs,
} from "@mui/material";
import { MdAdd as AddIcon, MdOpenInNew as OpenInNewIcon, MdDelete as DeleteIcon, MdMoreVert as MoreVertIcon, MdEdit as EditIcon, MdArrowBack as ArrowBackIcon, MdLogout as LogoutIcon, MdBookmarkAdd as BookmarkAddIcon } from "react-icons/md";
// Use React Icons (Flat Color)
import { 
  FcFolder, FcCommandLine, FcIdea, 
  FcLink, FcDocument, FcPuzzle, FcMusic, FcClapperboard, 
  FcDepartment, FcHome, FcBriefcase, FcShop, FcGlobe, FcSettings,
  FcCamera, FcCircuit
} from "react-icons/fc";

import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// Icon Registry for Mapping Strings to Components
const ICON_REGISTRY = {
  "folder": FcFolder,
  "rocket": FcIdea,      // Fallback for Startups
  "code": FcCommandLine,
  "palette": FcCamera,   // Fallback for Design
  "brain": FcCircuit,    // Fallback for AI
  "idea": FcIdea,
  "link": FcLink,
  "doc": FcDocument,
  "game": FcPuzzle,
  "music": FcMusic,
  "movie": FcClapperboard,
  "food": FcDepartment, // Close enough or use generic
  "home": FcHome,
  "work": FcBriefcase,
  "shop": FcShop,
  "globe": FcGlobe,
  "settings": FcSettings,
  // Detailed Logic for Legacy/Hardcoded Emojis
  "📁": FcFolder,
  "🚀": FcIdea,
  "🛠️": FcCommandLine,
  "📚": FcDocument,
  "🎨": FcCamera,
  "💡": FcIdea,
  "🔗": FcLink,
  "📝": FcDocument,
  "🎮": FcPuzzle,
  "🎵": FcMusic,
  "🎬": FcClapperboard,
  "🍔": FcDepartment,
  "🏠": FcHome,
  "💼": FcBriefcase,
  "🛒": FcShop,
  "🌍": FcGlobe
};

// Helper to get icon component (handles legacy emojis too)
const renderIcon = (iconName, props = {}) => {
  const Icon = ICON_REGISTRY[iconName];
  if (Icon) {
    return <Icon {...props} />;
  }
  // Fallback for legacy emojis or direct strings
  return <span style={{ fontSize: props.size || 24, lineHeight: 1 }}>{iconName || "📝"}</span>;
};

function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    url: "",
    category: "",
    notes: "",
    emoji: "",
  });
  const [dialogType, setDialogType] = useState("link"); // "link" or "collection"
  
  // Available Icons for Picker (exclude legacy emoji keys)
  const availableIcons = Object.keys(ICON_REGISTRY).filter(key => !/\p{Emoji}/u.test(key));

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [activeTab, setActiveTab] = useState("your");
  const [collectionMenuAnchor, setCollectionMenuAnchor] = useState(null);
  const [selectedCollectionForMenu, setSelectedCollectionForMenu] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  // Auth Page State
  const [showSignup, setShowSignup] = useState(false);

  // --- Account Settings Logic ---
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0); // 0: Profile, 1: Security
  
  // Settings Form State
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { user, token, logout, updateProfile, loading: authLoading } = useAuth();
  
  // Initialize avatar url when settings open
  useEffect(() => {
    if (openSettings && user) {
      setAvatarUrl(user.avatarUrl || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  }, [openSettings, user]);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
  };

  const handleOpenSettings = () => {
    handleCloseUserMenu();
    setOpenSettings(true);
  };
  
  const handleCloseSettings = () => setOpenSettings(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates = {};
      
      // Profile Tab
      if (settingsTab === 0) {
        updates.avatarUrl = avatarUrl.trim();
      } 
      // Security Tab
      else if (settingsTab === 1) {
        if (!currentPassword) throw new Error("Current password is required");
        if (newPassword !== confirmNewPassword) throw new Error("New passwords do not match");
        updates.currentPassword = currentPassword;
        updates.newPassword = newPassword;
      }

      await updateProfile(updates);
      setSnackbar({ open: true, message: "Profile updated successfully!", severity: "success" });
      handleCloseSettings();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update profile", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Public Collections State
  const [publicCollections, setPublicCollections] = useState([]);
  const [publicCategoryLinks, setPublicCategoryLinks] = useState([]);

  // Fetch Public Collections
  useEffect(() => {
    fetch(`${API_BASE}/collections/public`)
      .then(res => res.json())
      .then(data => setPublicCollections(data))
      .catch(err => console.error("Failed to load public collections:", err));
  }, []);

  // Handle shared URLs from PWA Share Target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    const sharedTitle = params.get('title') || '';
    
    if (sharedUrl && user) {
      console.log("[PWA Share] Received shared link:", sharedUrl, sharedTitle);
      // Pre-fill form with shared data
      setForm({
        title: sharedTitle || sharedUrl,
        url: sharedUrl.startsWith('http') ? sharedUrl : `https://${sharedUrl}`,
        category: "",
        notes: "",
        emoji: "link"
      });
      setDialogType("link");
      setEditingId(null);
      setOpenDialog(true);
      // Clean up URL params
      window.history.replaceState({}, '', '/');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  // Fetch Public Links when category is selected
  useEffect(() => {
    if (activeTab === "public" && selectedCategory !== "All") {
      setLoading(true);
      fetch(`${API_BASE}/collections/public/${encodeURIComponent(selectedCategory)}/links`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then(data => setPublicCategoryLinks(data))
        .catch(err => {
          console.error("Failed to load public links:", err);
          setPublicCategoryLinks([]);
        })
        .finally(() => setLoading(false));
    } else {
      setPublicCategoryLinks([]);
    }
  }, [activeTab, selectedCategory]);

  async function fetchLinks() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/links`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      console.log("[DEBUG] fetched links sample:", data.slice(0, 3));
      setLinks(data);
    } catch (err) {
      console.error("Failed to fetch links", err);
      setSnackbar({
        open: true,
        message: "Failed to load links. Make sure the backend server is running on port 4000.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }
  
  // --- AUTH GUARD ---
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: "#000000", color: "#FFFFFF" }}>
        <Typography variant="h6">LOADING SHELF...</Typography>
      </Box>
    );
  }

  if (!user) {
    if (showSignup) {
      return <SignupPage onSwitchToLogin={() => setShowSignup(false)} />;
    }
    return <LoginPage onSwitchToSignup={() => setShowSignup(true)} />;
  }

  function handleOpenDialog(type, data = null) {
    setDialogType(type);
    
    if (type === "link" && data) {
      setEditingId(data.id);
      setForm({
        category: data.category || "Uncategorized", // Preserve category or default
        title: data.title || "",
        url: data.url || "",
        emoji: data.emoji || "📝",
        notes: data.notes || ""
      });
    } else if (type === "renameCollection" && form.category) {
       // Keep existing category name for renaming
    } else if (type === "collection") {
      setForm({ category: "", title: "", url: "", emoji: "folder", notes: "" });
      setEditingId(null);
    } else {
      // Default for adding new link
      setForm({ 
        category: selectedCategory === "All" ? "Uncategorized" : selectedCategory, 
        title: "", 
        url: "", 
        emoji: "doc", 
        notes: "" 
      });
      setEditingId(null);
    }
    setOpenDialog(true);
  }

  function handleCloseDialog() {
    setOpenDialog(false);
    setEditingId(null);
    // Also clear collection selection if we were renaming
    if (dialogType === "renameCollection") {
        setSelectedCollectionForMenu(null);
    }
  }

  function handleOpenMenu(event, link) {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedLink(link);
  }

  function handleCloseMenu() {
    setMenuAnchor(null);
    setSelectedLink(null);
  }

  function handleEditClick() {
    if (selectedLink) {
      setForm({
        title: selectedLink.title,
        url: selectedLink.url,
        category: selectedLink.category || "",
        notes: selectedLink.notes || "",
      });
      setEditingId(selectedLink.id);
      setOpenDialog(true);
    }
    handleCloseMenu();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function generateTitleFromUrl(urlString) {
    try {
      // Add protocol if missing to parse URL
      const urlToParse = urlString.startsWith("http") ? urlString : `https://${urlString}`;
      const url = new URL(urlToParse);
      const hostname = url.hostname;
      
      // Remove www. prefix
      const domain = hostname.replace(/^www\./, "");
      
      // Extract main domain name (remove TLD)
      const domainParts = domain.split(".");
      const mainDomain = domainParts[0];
      
      // Capitalize first letter
      const autoTitle = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      return autoTitle;
    } catch (err) {
      return "";
    }
  }

  function handleUrlPaste(e) {
    const pastedText = e.clipboardData.getData("text");
    
    // Auto-generate title from pasted URL if title is empty
    if (pastedText && !form.title.trim()) {
      const autoTitle = generateTitleFromUrl(pastedText);
      if (autoTitle) {
        setForm((prev) => ({ ...prev, url: pastedText, title: autoTitle }));
        e.preventDefault(); // Prevent default paste to avoid double update
      }
    }
  }

  const handleSavePublicLink = (link) => {
    setForm({
      title: link.title,
      url: link.url,
      category: "", // User must choose a collection
      notes: link.notes || "",
      emoji: link.icon || "🔗" // Use existing icon or default
    });
    setDialogType("savePublicLink"); // Use a distinct type for clarity
    setEditingId(null); 
    setOpenDialog(true);
  };

  async function handleAddLink() {
    // Auto-generate title from URL if title is empty when saving
    let finalTitle = form.title.trim();
    if (!finalTitle && form.url.trim()) {
      finalTitle = generateTitleFromUrl(form.url);
    }

    // Handle collection creation with placeholder if no URL
    let urlToSave = form.url.trim();

    // RENAME COLLECTION LOGIC
    if (dialogType === "renameCollection") {
      const newName = form.category.trim();
      if (!newName) {
        setSnackbar({ open: true, message: "Collection name cannot be empty.", severity: "warning" });
        return;
      }
      // Check for duplicates
      const exists = links.some(l => (l.category || "").toLowerCase() === newName.toLowerCase() && (l.category || "").toLowerCase() !== (selectedCollectionForMenu || "").toLowerCase());
      if (exists) {
        setSnackbar({ open: true, message: "Collection name already exists!", severity: "warning" });
        return;
      }

      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/collections/${encodeURIComponent(selectedCollectionForMenu)}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ newName }),
        });

        if (!res.ok) throw new Error("Failed to rename collection");

        // Optimistically update frontend
        setLinks(prev => prev.map(l => (l.category === selectedCollectionForMenu ? { ...l, category: newName } : l)));
        setSnackbar({ open: true, message: "Collection renamed successfully!", severity: "success" });
        handleCloseDialog();
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to rename collection.", severity: "error" });
      } finally {
        setSaving(false);
      }
      return;
    }

    if (dialogType === "collection") {
      const collectionName = form.category.trim();
      if (!collectionName) {
        setSnackbar({ open: true, message: "Collection name is required.", severity: "warning" });
        return;
      }
      
      // Check for duplicate collection
      const exists = links.some(l => (l.category || "").toLowerCase() === collectionName.toLowerCase());
      if (exists) {
        setSnackbar({ open: true, message: "Collection already exists. Please choose another name.", severity: "warning" });
        return;
      }

      if (!urlToSave) {
        urlToSave = "shelf.internal/placeholder";
        if (!finalTitle) finalTitle = collectionName;
      }
    }

    // Handle Category for "savePublicLink"
    if (dialogType === "savePublicLink") {
         if (!form.category) {
            setSnackbar({ open: true, message: "Please select a category.", severity: "warning" });
            return;
         }
    }

    let finalCategory = form.category.trim();
    let selectedIcon = "";

    // 1. Try to inherit icon from existing category
    if (finalCategory) {
       const existingLink = links.find(l => (l.category === finalCategory) && !(l.url && l.url.includes("shelf.internal/placeholder")));
       if (existingLink) {
           selectedIcon = existingLink.icon;
           // Legacy fallback for existing
           if (!selectedIcon) {
                const parts = existingLink.category.split(' ');
                if (/\p{Emoji}/u.test(parts[0])) selectedIcon = parts[0];
           }
       }
    }

    // 2. If new category (or no icon found), check if user typed an emoji
    if (!selectedIcon && finalCategory) {
        const parts = finalCategory.split(' ');
        const potentialEmoji = parts[0];
        // Check for emoji char
        if (/\p{Emoji}/u.test(potentialEmoji)) {
            selectedIcon = potentialEmoji;
            // Strip emoji from category name for storage to keep it clean
            finalCategory = parts.slice(1).join(' '); 
        }
    }

    // 3. Fallback to form default (e.g. from Public Link or "doc")
    if (!selectedIcon) {
       selectedIcon = form.emoji || "doc";
    }
    console.log("[DEBUG] handleAddLink - form.emoji:", form.emoji, "selectedIcon:", selectedIcon);

    if (!finalTitle || !urlToSave) {
      setSnackbar({
        open: true,
        message: "Please fill in the required fields.",
        severity: "warning",
      });
      return;
    }

    const finalUrl = urlToSave.startsWith("http://") || urlToSave.startsWith("https://") || urlToSave.includes("shelf.internal")
      ? urlToSave
      : `https://${urlToSave}`;

    const linkData = {
      title: finalTitle,
      url: finalUrl,
      category: finalCategory,
      notes: form.notes.trim(),
      icon: selectedIcon,
      isPublic: false  // Default to private
    };

    // If adding to public shelf (standard "link" dialog while in public tab)
    if (activeTab === "public" && dialogType === "link") {
        linkData.isPublic = true;
    }

    console.log("[DEBUG] handleAddLink", { activeTab, dialogType, linkData });

    setSaving(true);
    try {
      if (editingId) {
        // Update existing link
        const res = await fetch(`${API_BASE}/links/${editingId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(linkData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${res.status}`);
        }

        const updatedLink = await res.json();
        setLinks((prev) => prev.map((l) => (l.id === editingId ? updatedLink : l)));
        setSnackbar({
          open: true,
          message: "Link updated successfully!",
          severity: "success",
        });
      } else {
        // Add new link
        const res = await fetch(`${API_BASE}/links`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(linkData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${res.status}`);
        }

        const newLink = await res.json();
        console.log("[DEBUG] Created newLink:", { id: newLink.id, title: newLink.title, icon: newLink.icon, category: newLink.category });
        
        if (linkData.isPublic) {
             setPublicCategoryLinks(prev => [newLink, ...prev]);
        } else {
             setLinks((prev) => [newLink, ...prev]);
        }

        setSnackbar({
          open: true,
          message: "Link saved successfully!",
          severity: "success",
        });
      }
      setOpenDialog(false);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save link", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save link. Make sure the backend server is running on port 4000.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLink() {
    if (!selectedLink) return;
    console.log("[DEBUG] Deleting link:", { id: selectedLink.id, title: selectedLink.title, category: selectedLink.category });
    try {
      const res = await fetch(`${API_BASE}/links/${selectedLink.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete link");
      }

      setLinks((prev) => prev.filter((l) => l.id !== selectedLink.id));
      setSnackbar({ open: true, message: "Link deleted successfully", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to delete link", severity: "error" });
    } finally {
      handleCloseMenu();
    }
  }

  // Extract unique categories
  const rawCategories = [...new Set(links.map((l) => l.category).filter(Boolean))].sort();
  const hasUncategorized = links.some(l => !l.category);
  const displayCategories = hasUncategorized ? [...rawCategories, "Uncategorized"] : rawCategories;
  const categories = ["All", ...displayCategories];

  function handleOpenCollectionMenu(event, category) {
    event.stopPropagation();
    setCollectionMenuAnchor(event.currentTarget);
    setSelectedCollectionForMenu(category);
  }

  function handleCloseCollectionMenu() {
    setCollectionMenuAnchor(null);
    // Do not clear selectedCollectionForMenu here, as it's needed for the dialogs.
    // We will clear it when the dialogs close.
  }

  function handleEditCollection() {
    handleCloseCollectionMenu();
    setDialogType("renameCollection");
    setForm({
      ...form,
      category: selectedCollectionForMenu,
    });
    setOpenDialog(true);
  }

  function handleDeleteCollectionClick() {
    handleCloseCollectionMenu();
    setDeleteConfirmationOpen(true);
  }

  async function handleConfirmDeleteCollection() {
    if (!selectedCollectionForMenu) return;

    try {
      const res = await fetch(`${API_BASE}/collections/${encodeURIComponent(selectedCollectionForMenu)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to delete collection");
      
      setLinks((prev) => prev.filter(l => l.category !== selectedCollectionForMenu));
      setSnackbar({ open: true, message: "Collection deleted successfully", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to delete collection", severity: "error" });
    } finally {
      setDeleteConfirmationOpen(false);
      setSelectedCollectionForMenu(null);
    }
  }

  function handleRenameCollection(newName) {
     // This logic will be inside handleAddLink or similar, checking dialogType
  }

  function handleRenameCollection(newName) {
     // This logic will be inside handleAddLink or similar, checking dialogType
  }

  const linksSource = activeTab === "public" ? publicCategoryLinks : links;

  const filteredLinks = linksSource.filter((l) => {
    // Hide internal placeholder links used to define collections
    if (l.url && l.url.includes("shelf.internal/placeholder")) {
      return false;
    }

    const q = search.toLowerCase();
    
    // Search logic
    const emoji = l.icon || (l.category ? l.category.split(' ')[0] : "");
    const categoryName = l.category ? (l.icon ? l.category : (l.category.includes(' ') && /\p{Emoji}/u.test(l.category.split(' ')[0]) ? l.category.split(' ').slice(1).join(' ') : l.category)) : "";

    const matchesSearch =
      l.title.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      categoryName.toLowerCase().includes(q) ||
      (emoji && emoji.includes(q)) ||
      (l.notes || "").toLowerCase().includes(q);
    
    // Category logic
    const matchesCategory =
      activeTab === "public" || // Public links are already filtered by API
      selectedCategory === "All" || 
      (selectedCategory === "Uncategorized" ? !l.category : l.category === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#ffffff",
        color: "#000000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          borderBottom: "2px solid #000000", 
          bgcolor: "#ffffff", 
          py: 1, 
        }}
      >
        <Toolbar sx={{ 
          justifyContent: "space-between", 
          flexWrap: "wrap", 
          gap: 2,
          px: { xs: 2, sm: 3 }
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Logo - Always Left */}
            <Typography
              variant="h6"
              onClick={() => setSelectedCategory("All")}
              sx={{
                fontWeight: 900,
                fontSize: "1.75rem",
                letterSpacing: "-0.05em",
                color: "#000000",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              SHELF
            </Typography>
          </Stack>

          {/* Spacer to push search/menu to right */}
          <Box sx={{ flexGrow: 1 }} />

          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              size="small"
              placeholder="SEARCH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="outlined"
              sx={{
                width: { xs: "100%", sm: 240 },
                "& .MuiInputBase-input": {
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                },
              }}
            />
            
            {/* User Menu */}
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Account Settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, border: "2px solid #000000" }}>
                  <Avatar 
                    alt={user.username} 
                    src={user.avatarUrl} 
                    sx={{ bgcolor: "#000000", color: "#ffffff", fontWeight: "bold" }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={handleOpenSettings}>
                  <Typography textAlign="center">Settings</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* --- SETTINGS DIALOG --- */}
      <Dialog open={openSettings} onClose={handleCloseSettings} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, letterSpacing: "-0.02em" }}>ACCOUNT SETTINGS</DialogTitle>
        <DialogContent>
           {/* Simple Tabs implementation */}
           <Stack direction="row" spacing={1} sx={{ mb: 3, borderBottom: "1px solid #e0e0e0" }}>
              <Button 
                onClick={() => setSettingsTab(0)}
                sx={{ 
                  borderRadius: 0, 
                  color: settingsTab === 0 ? "#000000" : "#999", 
                  fontWeight: 700,
                  borderBottom: settingsTab === 0 ? "2px solid #000000" : "none" 
                }}
              >
                PROFILE
              </Button>
              <Button 
                onClick={() => setSettingsTab(1)}
                sx={{ 
                  borderRadius: 0, 
                  color: settingsTab === 1 ? "#000000" : "#999", 
                  fontWeight: 700,
                  borderBottom: settingsTab === 1 ? "2px solid #000000" : "none" 
                }}
              >
                SECURITY
              </Button>
           </Stack>

          {settingsTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
               <Avatar 
                  src={avatarUrl} 
                  sx={{ width: 80, height: 80, mb: 1, bgcolor: "#000000", fontSize: '2rem', border: "2px solid #000000" }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <TextField
                  autoFocus
                  margin="dense"
                  label="PROFILE PHOTO URL"
                  fullWidth
                  variant="outlined"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
            </Box>
          )}

          {settingsTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                type="password"
                margin="dense"
                label="CURRENT PASSWORD"
                fullWidth
                variant="outlined"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <TextField
                type="password"
                margin="dense"
                label="NEW PASSWORD"
                fullWidth
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                type="password"
                margin="dense"
                label="CONFIRM PASSWORD"
                fullWidth
                variant="outlined"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                error={newPassword !== confirmNewPassword}
                helperText={newPassword !== confirmNewPassword ? "PASSWORDS DO NOT MATCH" : ""}
              />
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseSettings} sx={{ color: "#000000", fontWeight: 700 }}>CANCEL</Button>
          <Button 
            onClick={handleSaveSettings} 
            variant="contained" 
            sx={{ 
              bgcolor: "#000000", 
              fontWeight: 700,
              '&:hover': { bgcolor: "#333333" } 
            }}
            disabled={saving}
          >
            {saving ? "SAVING..." : "SAVE"}
          </Button>
        </DialogActions>
      </Dialog>

      <Container 
        maxWidth="xl"
        sx={{ 
          py: { xs: 4, sm: 6 }, 
          flexGrow: 1 
        }}
      >
        <Stack spacing={4}>
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={() => { setActiveTab("your"); setSelectedCategory("All"); }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 0,
                fontWeight: 900,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                bgcolor: activeTab === "your" ? "#000000" : "#ffffff",
                color: activeTab === "your" ? "#ffffff" : "#000000",
                border: "2px solid #000000",
                "&:hover": { 
                  bgcolor: activeTab === "your" ? "#000000" : "#e0e0e0",
                  color: activeTab === "your" ? "#ffffff" : "#000000"
                }
              }}
            >
              YOUR COLLECTIONS
            </Button>
            <Button
              onClick={() => { setActiveTab("public"); setSelectedCategory("All"); }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 0,
                fontWeight: 900,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                bgcolor: activeTab === "public" ? "#000000" : "#ffffff",
                color: activeTab === "public" ? "#ffffff" : "#000000",
                border: "2px solid #000000",
                "&:hover": { 
                  bgcolor: activeTab === "public" ? "#000000" : "#e0e0e0",
                  color: activeTab === "public" ? "#ffffff" : "#000000"
                }
              }}
            >
              PUBLIC SHELVES
            </Button>
          </Stack>

          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              {selectedCategory !== "All" && !search && (
                <Stack direction="row" alignItems="center" spacing={3}> {/* Inner stack for Nav + Divider with larger spacing */}
                  <IconButton 
                    onClick={() => setSelectedCategory("All")}
                    sx={{ 
                      color: "#000000", 
                      border: "3px solid #000000",
                      borderRadius: 0,
                      p: 1.5,
                      "&:hover": { bgcolor: "#000000", color: "#ffffff" }
                    }}
                  >
                    <ArrowBackIcon fontSize="medium" />
                  </IconButton>
                  
                  {/* Vertical Separator */}
                  <Box sx={{ width: "4px", height: "48px", bgcolor: "#505050ff" }} />
                </Stack>
              )}

              {/* Header Content */}
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Icon Section (if not All/Search) */}
                {selectedCategory !== "All" && !search && (() => {
                  // Get icon from the appropriate data source based on active tab
                  let icon = "folder";
                  if (activeTab === "public") {
                    // For public tab, check publicCollections
                    const pubColl = publicCollections.find(c => c.name === selectedCategory);
                    icon = pubColl?.icon || "folder";
                  } else {
                    // For private tab, check links
                    const categoryLink = links.find(l => l.category === selectedCategory && l.icon);
                    icon = categoryLink?.icon || (selectedCategory.includes(" ") ? selectedCategory.split(" ")[0] : "folder");
                  }
                  return (
                    <Box sx={{ fontSize: "2.5rem", lineHeight: 1 }}>
                      {renderIcon(icon, { size: 40 })}
                    </Box>
                  );
                })()}

                {/* Text Section (Title + Description) */}
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight={900} 
                    sx={{ 
                      letterSpacing: "-0.04em",
                      textTransform: "uppercase",
                      lineHeight: 1,
                      mb: 0.5
                    }}
                  >
                    {search 
                      ? (selectedCategory === "All" ? "SEARCH RESULTS" : `SEARCH IN ${selectedCategory}`)
                      : (selectedCategory === "All" 
                          ? "COLLECTIONS" 
                          : (selectedCategory.includes(" ") ? selectedCategory.substring(selectedCategory.indexOf(" ") + 1) : selectedCategory))}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "#666666", maxWidth: 600 }}>
                    {search
                      ? `FOUND MATCHES FOR "${search.toUpperCase()}"`
                      : (selectedCategory === "All" 
                          ? "YOUR CURATED DIGITAL LIBRARY. ORGANIZED BY CATEGORY."
                          : `VIEWING ALL ITEMS IN ${selectedCategory.includes(" ") ? selectedCategory.substring(selectedCategory.indexOf(" ") + 1).toUpperCase() : selectedCategory.toUpperCase()}.`)} 
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {!loading && selectedCategory === "All" && !search && (
            <Grid container spacing={4}>
              {activeTab === "your" ? displayCategories.map((category) => {
                // Get ALL links in category to find icon (including placeholders)
                const allCategoryLinks = links.filter(l => l.category === category);
                // Filter out placeholders for count and display
                const categoryLinks = allCategoryLinks.filter(l => !(l.url && l.url.includes("shelf.internal/placeholder")));
                const count = categoryLinks.length;
                
                // Find icon from ANY link in this category (including placeholder)
                const sampleLink = allCategoryLinks.find(l => l.icon) || allCategoryLinks[0];
                const storedIcon = sampleLink ? sampleLink.icon : "";

                // Legacy fallback: Check if category name has emoji prepended
                const parts = category.split(" ");
                const potentialKey = parts[0];
                const isLegacyEmoji = /\p{Emoji}/u.test(potentialKey) || ICON_REGISTRY[potentialKey];
                
                const emoji = storedIcon || (isLegacyEmoji ? potentialKey : "folder");
                const name = storedIcon ? category : (isLegacyEmoji ? parts.slice(1).join(" ") : category);
                
                console.log(`[DEBUG] Category: ${category}, Links: ${count}, storedIcon: '${storedIcon}', emoji: '${emoji}'`);

                return (
                  <Grid item key={category} xs={12} sm={6} md={4}>
                    <Card
                      onClick={() => setSelectedCategory(category)}
                      sx={{
                        height: "100%",
                        cursor: "pointer",
                        p: 1,
                        bgcolor: "#ffffff",
                        "&:hover": {
                          borderColor: "#000000",
                          "& .category-icon": {
                            bgcolor: "#e0e0e0", // Lighter gray for colorful icons
                            // color: "#ffffff" // Don't invert color for Fc icons
                          }
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={3} alignItems="flex-start">
                          <Stack direction="row" justifyContent="space-between" width="100%">
                            <Box
                              className="category-icon"
                              sx={{
                                width: 48,
                                height: 48,
                                border: "2px solid #000000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {renderIcon(emoji, { size: 28 })}
                            </Box>
                            {category !== "Uncategorized" && (
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenCollectionMenu(e, category)}
                                sx={{ 
                                  color: "#000000",
                                  p: 0.5,
                                  "&:hover": { bgcolor: "rgba(0,0,0,0.05)" }
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            )}
                          </Stack>
                          <Box>
                            <Typography variant="h6" sx={{ fontSize: "1.1rem", mb: 0.5 }}>
                              {name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.1em", color: "#999999" }}>
                              {count} {count === 1 ? "ITEM" : "ITEMS"}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              }) : publicCollections.map((pub) => {
                const count = links.filter(l => l.category === (pub.name || pub.category)).length;
                
                // Use icon from database, fallback to name-based logic
                let iconKey = pub.icon || "folder";
                if (!pub.icon) {
                  const catName = (pub.name || pub.category || "").toLowerCase();
                  if (catName.includes("startups")) iconKey = "rocket";
                  else if (catName.includes("dev tools")) iconKey = "code";
                  else if (catName.includes("design")) iconKey = "palette";
                  else if (catName.includes("ai models")) iconKey = "brain";
                }

                return (
                <Grid item key={pub._id || pub.name || pub.category} xs={12} sm={6} md={3}>
                  <Card
                    onClick={() => setSelectedCategory(pub.name || pub.category)}
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      border: "2px solid #000000",
                      borderRadius: 0,
                      "&:hover": { boxShadow: "8px 8px 0px #000000", transform: "translate(-4px, -4px)" }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Box sx={{ 
                          fontSize: "2rem", 
                          border: "2px solid #000000", 
                          width: "fit-content", 
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#f5f5f5" 
                        }}>
                          {renderIcon(iconKey, { size: 32 })}
                        </Box>
                        <Stack>
                          <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                            {(pub.name || pub.category || "").replace(/^\p{Emoji}\s*/u, '')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#999999", fontWeight: 700 }}>
                            {count} ITEMS
                          </Typography>
                        </Stack>
                        <Stack>
                        <Typography variant="body2" sx={{ color: "#666666", fontSize: "0.8rem", height: 40, overflow: "hidden" }}>
                          {pub.description}
                        </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ); })}
              
              {activeTab === "your" && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    onClick={() => handleOpenDialog("collection")}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "2px dashed #cccccc",
                      bgcolor: "transparent",
                      minHeight: "140px", // Match approximate height of link cards
                      px: 4,
                      "&:hover": {
                        borderColor: "#000000",
                        bgcolor: "#f9f9f9",
                        transform: "translate(-2px, -2px)"
                      },
                    }}
                  >
                    <Stack spacing={1} alignItems="center">
                      <AddIcon sx={{ fontSize: 32 }} />
                      <Typography variant="button" sx={{ letterSpacing: "0.1em" }}>
                        NEW COLLECTION
                      </Typography>
                    </Stack>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}


          {!loading && (selectedCategory !== "All" || search) && (
            <Grid container spacing={3} alignItems="flex-start">
            {filteredLinks.map((link) => (
              <Grid item key={link.id} xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    height: "100%",
                    perspective: "1000px",
                    "&:hover": {
                      "& .visit-button": {
                        opacity: 1,
                        transform: "translateY(0)",
                      },
                      "& .link-notes": {
                        maxHeight: "100px", // Expand to show notes
                        opacity: 1,
                      }
                    }
                  }}
                >
                  <Card
                    sx={{
                      maxWidth: 360,
                      mx: "auto",
                      height: "100%",
                      p: 0,
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      border: "2px solid #000000",
                      borderRadius: 0,
                      transition: "all 0.2s ease",
                      "&:hover": {
                         borderColor: "#000000",
                         boxShadow: "4px 4px 0px #000000",
                         transform: "translate(-2px, -2px)"
                      }
                    }}
                  >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Stack spacing={2}>
                      {/* Top Row: Favicon, Title, More Options */}
                      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: "hidden" }}>
                          <Box
                            component="img"
                            src={(() => {
                              try {
                                return `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`;
                              } catch (e) {
                                return "";
                              }
                            })()}
                            alt=""
                            sx={{ width: 20, height: 20, flexShrink: 0 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: "1rem",
                              lineHeight: 1.2,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "-0.02em",
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 1,
                              overflow: "hidden",
                            }}
                          >
                            {link.title}
                          </Typography>
                        </Stack>
                        {activeTab === "public" ? (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<BookmarkAddIcon />}
                              onClick={() => handleSavePublicLink(link)}
                              sx={{
                                color: "#000000",
                                borderColor: "#000000",
                                fontWeight: 800,
                                fontSize: "0.7rem",
                                borderRadius: 0,
                                px: 1,
                                minWidth: "auto",
                                "&:hover": {
                                  bgcolor: "#000000",
                                  color: "#ffffff"
                                }
                              }}
                            >
                              SAVE
                            </Button>
                          ) : (
                            <IconButton
                              size="small"
                              sx={{ borderRadius: 0, p: 0.5, border: "1px solid transparent", "&:hover": { border: "1px solid #000000" } }}
                              onClick={(e) => handleOpenMenu(e, link)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          )}
                      </Stack>

                      {/* URL Row with Overlay Button */}
                      <Box sx={{ position: "relative", mt: 0.5 }}>
                        {/* The URL Text */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#999999",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            wordBreak: "break-all",
                            overflow: "hidden",
                            textTransform: "uppercase",
                            height: "36px", // Fixed height for alignment
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          {link.url}
                        </Typography>

                         {/* The Visit Button Overlay */}
                         <Button
                          variant="contained"
                          onClick={() => window.open(link.url, "_blank")}
                          className="visit-button"
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            bgcolor: "#000000",
                            color: "#ffffff",
                            borderRadius: 0,
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            fontSize: "0.75rem",
                            opacity: 0, // Hidden by default
                            transform: "translateY(10px)",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                              bgcolor: "#333333",
                            }
                          }}
                        >
                          VISIT LINK <OpenInNewIcon sx={{ fontSize: 16, ml: 1 }} />
                        </Button>
                      </Box>

                      </Stack>
                      
                      {/* Notes visible on hover */}
                      {link.notes && (
                        <Box
                          className="link-notes"
                          sx={{
                            maxHeight: 0,
                            opacity: 0,
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            mt: 0 // Margin applied in transition or inside
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#666666",
                              fontSize: "0.8rem",
                              pt: 1.5,
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 3,
                            }}
                          >
                            {link.notes}
                          </Typography>
                        </Box>
                      )}
                  </CardContent>
                </Card>
              </Box>
            </Grid>
            ))}
            
            {/* Add Link Card - Available in both private and PUBLIC modes */}
            <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ height: "100%" }}> 
                  <Card
                    sx={{
                      height: "100%", // Fill the grid item height
                      minHeight: "120px", // Uniform height matching other cards
                      maxWidth: 360,
                      mx: "auto",
                      mb: "72px", 
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "2px dashed #cccccc",
                      borderRadius: 0,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      px: 4,
                      "&:hover": {
                        borderColor: "#000000",
                        bgcolor: "#f9f9f9",
                        transform: "translate(-4px, -4px)",
                        boxShadow: "8px 8px 0px #000000",
                      },
                    }}
                    onClick={() => handleOpenDialog("link")}
                  >
                    <Stack spacing={1} alignItems="center">
                      <AddIcon />
                      <Typography variant="button" sx={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                        ADD LINK
                      </Typography>
                    </Stack>
                  </Card>
                </Box>
              </Grid>
          </Grid>
        )}
        </Stack>
      </Container>

      <Box>
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 0,
              border: "4px solid #000000",
              boxShadow: "12px 12px 0px #000000",
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", fontSize: "1.5rem", letterSpacing: "-0.05em" }}>
            {dialogType === "collection" 
              ? "NEW COLLECTION" 
              : dialogType === "renameCollection"
              ? "RENAME COLLECTION"
              : (editingId ? "EDIT LINK" : "ADD LINK")}
            {dialogType === "savePublicLink" && "SAVE TO COLLECTION"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} mt={1}>
              {(dialogType === "collection" || dialogType === "renameCollection") && (
                <TextField
                  label="COLLECTION NAME"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ sx: { fontWeight: 700 } }}
                />
              )}
              {dialogType === "link" && (
                <>
                  <TextField
                    label="TITLE"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ sx: { fontWeight: 700 } }}
                  />
                  <TextField
                    label="URL"
                    name="url"
                    value={form.url}
                    onChange={handleChange}
                    onPaste={handleUrlPaste}
                    required
                    fullWidth
                    placeholder="https://..."
                    InputLabelProps={{ sx: { fontWeight: 700 } }}
                  />
                </>
              )}

              {dialogType === "savePublicLink" && (
                <>
                   <TextField
                      select
                      label="SELECT COLLECTION"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      fullWidth
                      required
                      InputLabelProps={{ sx: { fontWeight: 700 } }}
                   >
                     {displayCategories
                         .filter(cat => cat !== "All" && cat !== "Uncategorized")
                         .map((option) => (
                       <MenuItem key={option} value={option}>
                         {option}
                       </MenuItem>
                     ))}
                   </TextField>
                   
                   <TextField
                    label="TITLE"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ sx: { fontWeight: 700 } }}
                  />
                </>
              )}
              
              {dialogType === "collection" && (
                <Box>
                  <Typography variant="caption" sx={{ mb: 1.5, display: "block", fontWeight: 800, letterSpacing: "0.05em" }}>
                    SELECT ICON
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {availableIcons.map((iconName) => (
                      <Box
                        key={iconName}
                        onClick={() => setForm(prev => ({ ...prev, emoji: iconName }))}
                        sx={{
                          width: 48,
                          height: 48,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          border: "1px solid",
                          borderColor: form.emoji === iconName ? "#000000" : "#eeeeee",
                          bgcolor: form.emoji === iconName ? "#f0f0f0" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": { borderColor: "#000000", bgcolor: "#f5f5f5" }
                        }}
                      >
                        {renderIcon(iconName, { size: 28 })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {dialogType === "link" && (
                <TextField
                  label="NOTES"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Optional notes..."
                  InputLabelProps={{ sx: { fontWeight: 700 } }}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={handleCloseDialog} 
              disabled={saving}
              sx={{ border: "none", "&:hover": { bgcolor: "#eeeeee", color: "#000000", boxShadow: "none" } }}
            >
              CANCEL
            </Button>
            <Button
              variant="contained"
              onClick={handleAddLink}
              disabled={(dialogType === "link" && !form.url.trim()) || (dialogType === "collection" && !form.category.trim()) || (dialogType === "savePublicLink" && !form.category) || saving}
              sx={{ bgcolor: "#000000", color: "#ffffff", px: 4 }}
            >
              {saving ? "SAVING..." : "SAVE"}
            </Button>
          </DialogActions>
        </Dialog>

      {/* Collection Menu */}
      <Menu
        anchorEl={collectionMenuAnchor}
        open={Boolean(collectionMenuAnchor)}
        onClose={handleCloseCollectionMenu}
        PaperProps={{
          sx: {
            borderRadius: 0,
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px #000000",
            mt: 1,
          }
        }}
      >
        <MenuItem
          onClick={handleEditCollection}
          sx={{
            gap: 1.5,
            py: 1.5,
            minWidth: 150,
            "&:hover": { bgcolor: "#000000", color: "#ffffff", "& .MuiListItemIcon-root": { color: "#ffffff" } },
          }}
        >
          <ListItemIcon sx={{ minWidth: "auto", color: "#000000" }}>
            <EditIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText 
            primary="RENAME" 
            primaryTypographyProps={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.05em"
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleDeleteCollectionClick}
          sx={{
            gap: 1.5,
            py: 1.5,
            "&:hover": { bgcolor: "#ff0000", color: "#ffffff", "& .MuiListItemIcon-root": { color: "#ffffff" } },
          }}
        >
          <ListItemIcon sx={{ minWidth: "auto", color: "#ff0000" }}>
            <DeleteIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText 
            primary="DELETE" 
            primaryTypographyProps={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.05em"
            }}
          />
        </MenuItem>
      </Menu>

      {/* Existing Link Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 0,
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px #000000",
            mt: 1,
            zIndex: 9999
          }
        }}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            handleOpenDialog("link", selectedLink);
          }}
          sx={{
          }}
        >
          <ListItemIcon sx={{ minWidth: "auto", color: "#000000" }}>
            <EditIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText 
            primary="EDIT" 
            primaryTypographyProps={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.05em"
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleDeleteLink}
          sx={{
            gap: 1.5,
            py: 1.5,
            "&:hover": { bgcolor: "#ff0000", color: "#ffffff", "& .MuiListItemIcon-root": { color: "#ffffff" } },
          }}
        >
          <ListItemIcon sx={{ minWidth: "auto", color: "#ff0000" }}>
            <DeleteIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText 
            primary="DELETE" 
            primaryTypographyProps={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.05em"
            }}
          />
        </MenuItem>
      </Menu>

      {/* Delete Collection Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => { setDeleteConfirmationOpen(false); setSelectedCollectionForMenu(null); }}
        PaperProps={{
          sx: {
            borderRadius: 0,
            border: "2px solid #000000",
            boxShadow: "8px 8px 0px #000000",
            p: 2,
            minWidth: 320
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", fontSize: "1.2rem", p: 2 }}>
          Delete Collection?
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Are you sure you want to delete "{selectedCollectionForMenu}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 700 }}>
            ⚠️ This will permanently delete ALL links in this collection.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 2 }}>
          <Button 
            onClick={() => setDeleteConfirmationOpen(false)}
            sx={{ 
              fontWeight: 800,
              color: "#000000",
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" }
            }}
          >
            CANCEL
          </Button>
          <Button 
            onClick={handleConfirmDeleteCollection}
            variant="contained"
            sx={{ 
              borderRadius: 0,
              bgcolor: "#ff0000",
              color: "#ffffff",
              fontWeight: 800,
              boxShadow: "none",
              border: "2px solid #ff0000",
              "&:hover": { bgcolor: "#d32f2f", boxShadow: "none" } 
            }}
          >
            DELETE
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            borderRadius: 0, 
            bgcolor: "#000000", 
            color: "#ffffff",
            fontWeight: 700,
            border: "2px solid #000000",
            "& .MuiAlert-icon": { color: "#ffffff" }
          }}
        >
          {snackbar.message.toUpperCase()}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  );
}

export default App;
