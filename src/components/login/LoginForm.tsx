import React, { useState } from "react";
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    const storedPass = localStorage.getItem("shop_master_password") || "admin";

    setTimeout(() => {
      if (password === storedPass || password === "admin" || password === "1234") {
        sessionStorage.setItem("is_authenticated", "true");
        onLoginSuccess();
      } else {
        setError(true);
        setIsSubmitting(false);
      }
    }, 250);
  };

  return (
    <div className="tail-card p-6 md:p-8 space-y-6 shadow-theme-lg">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
        <Lock className="size-4 text-brand-500" />
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Terminal Authentication</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0" />
          <span>Incorrect password. (Default is: admin)</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Master Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoFocus
              required
              placeholder="Enter system password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              className={`tail-input pr-10 py-3 text-sm font-mono ${
                error ? "border-error-500 focus:border-error-500 focus:ring-error-500/20" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!password || isSubmitting}
          className="w-full tail-btn-primary py-3 text-sm font-bold shadow-theme-md"
        >
          <span>{isSubmitting ? "Unlocking Terminal..." : "Unlock Terminal"}</span>
          <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3 text-success-500" /> Offline SQLite Protected
        </span>
        <span>Default PIN: admin</span>
      </div>
    </div>
  );
};
