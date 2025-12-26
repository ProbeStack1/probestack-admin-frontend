import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const AuthContext = createContext({
  admin: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  isSuperAdmin: false,
  isOrgAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get("/auth/me");
          setAdmin(response.data);
        } catch (error) {
          console.error("Auth init error:", error);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, admin: adminData } = response.data;
    
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAdmin(adminData);
    
    return adminData;
  };

  const register = async (email, password, name) => {
    const response = await api.post("/auth/register", { email, password, name });
    const { token: newToken, admin: adminData } = response.data;
    
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAdmin(adminData);
    
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAdmin(null);
  };

  // Derived role helpers
  const isSuperAdmin = admin?.role === "super_admin";
  const isOrgAdmin = admin?.role === "org_admin";

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        loading,
        isSuperAdmin,
        isOrgAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
