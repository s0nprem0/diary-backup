"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if password has been set up
    const passwordSetup = authService.isPasswordSetup();
    setIsSignupMode(!passwordSetup);
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!password.trim()) {
      setError("Please enter a password");
      setLoading(false);
      return;
    }

    if (isSignupMode) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
    }

    try {
      const success = isSignupMode
        ? authService.signup(password)
        : authService.login(password);

      if (success) {
        router.push("/");
      } else {
        setError(
          isSignupMode ? "Failed to create password" : "Invalid password"
        );
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          🔐 Mood Diary
        </h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
          {isSignupMode
            ? "Create a password to protect your diary"
            : "Enter your password to access your diary"}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your diary password"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingRight: "2.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {isSignupMode && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    paddingRight: "2.5rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                  }}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                color: "#dc2626",
                marginBottom: "1rem",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: loading ? "#ccc" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? isSignupMode
                ? "Creating Password..."
                : "Authenticating..."
              : isSignupMode
              ? "Create Password"
              : "Unlock Diary"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            color: "#999",
            fontSize: "0.75rem",
            marginTop: "1.5rem",
          }}
        >
          All entries are stored locally and remain private
        </p>
      </div>
    </div>
  );
}
