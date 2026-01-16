import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Sun, Moon, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import { seedApi, api } from "../lib/api";
import { getErrorMessage } from "../lib/utils";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("Password reset instructions sent!");
      // For testing, show the reset token
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
        setShowResetForm(true);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to request password reset"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password?reset_token=${encodeURIComponent(resetToken)}&new_password=${encodeURIComponent(newPassword)}`);
      toast.success("Password reset successfully! You can now login.");
      setShowForgotPassword(false);
      setShowResetForm(false);
      setForgotEmail("");
      setResetToken("");
      setNewPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedApi.seed();
      toast.success("Demo data seeded successfully!");
    } catch (error) {
      toast.error("Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="login-page">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute h-full w-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.15]" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-primary-foreground font-bold">PS</span>
          </div>
          <span className="font-bold text-xl tracking-tight">ProbeStack</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your organizations, subscriptions, and users</p>
          </div>

          <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/80">
            <CardHeader className="text-center">
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      data-testid="login-password-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Don't have an account? Contact your administrator.
              </p>
            </CardContent>
          </Card>

          
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © 2024 ProbeStack. All rights reserved.
      </footer>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {showResetForm ? "Reset Password" : "Forgot Password"}
            </DialogTitle>
            <DialogDescription>
              {showResetForm 
                ? "Enter your new password below." 
                : "Enter your email address and we'll send you instructions to reset your password."
              }
            </DialogDescription>
          </DialogHeader>
          
          {!showResetForm ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">Reset token received. Enter your new password:</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            {showResetForm && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowResetForm(false);
                  setResetToken("");
                  setNewPassword("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button 
              onClick={showResetForm ? handleResetPassword : handleForgotPassword} 
              disabled={loading}
            >
              {loading ? "Processing..." : (showResetForm ? "Reset Password" : "Send Reset Link")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
