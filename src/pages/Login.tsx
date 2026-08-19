import React from "react";
import { LoginBrandHeader } from "../components/login/LoginBrandHeader";
import { LoginForm } from "../components/login/LoginForm";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 antialiased dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6">
        <LoginBrandHeader />
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  );
};
