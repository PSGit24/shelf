import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on load
    const storedUser = localStorage.getItem("shelf_user");
    const storedToken = localStorage.getItem("shelf_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);
  const login = async (username, password) => {
    // Hardcoded for debugging
    const baseUrl = "http://localhost:4000/api";
    console.log("Login Request to:", `${baseUrl}/auth/login`);
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("shelf_user", JSON.stringify(data.user));
    localStorage.setItem("shelf_token", data.token);
    setUser(data.user);
    setToken(data.token);
  };

  const signup = async (username, password) => {
    // Hardcoded for debugging
    const baseUrl = "http://localhost:4000/api";
    console.log("Signup Request to:", `${baseUrl}/auth/signup`);
    const res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Signup failed");

    localStorage.setItem("shelf_user", JSON.stringify(data.user));
    localStorage.setItem("shelf_token", data.token);
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem("shelf_user");
    localStorage.removeItem("shelf_token");
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (data) => {
    // Hardcoded for debugging
    const baseUrl = "http://localhost:4000/api";
    console.log("Update Profile Request to:", `${baseUrl}/auth/profile`);
    
    const res = await fetch(`${baseUrl}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();
    if (!res.ok) throw new Error(responseData.message || "Failed to update profile");

    // Update local state and storage
    const updatedUser = { ...user, ...responseData.user };
    localStorage.setItem("shelf_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
