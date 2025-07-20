import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";

interface LoginScreenProps {
  onNavigate: (screen: string) => void;
}

export const LoginScreen = ({ onNavigate }: LoginScreenProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // In a real app, this would handle authentication
    onNavigate("buyer-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-light via-seafoam to-aqua-soft px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8 animate-fade-in">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("welcome")}
          className="text-ocean-primary hover:bg-white/20 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-ocean-primary ml-4">Login</h1>
      </div>

      {/* Login Form */}
      <div className="max-w-sm mx-auto animate-slide-up">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-ocean-primary">
              Welcome Back
            </CardTitle>
            <p className="text-ocean-medium text-sm">
              Sign in to your MARINA account
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ocean-primary font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-medium" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-11 h-12 border-ocean-light/30 focus:border-aqua-bright rounded-xl"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-ocean-primary font-medium"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-medium" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-11 pr-11 h-12 border-ocean-light/30 focus:border-aqua-bright rounded-xl"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-ocean-medium" />
                  ) : (
                    <Eye className="w-5 h-5 text-ocean-medium" />
                  )}
                </Button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Button
                variant="link"
                className="text-aqua-bright hover:text-aqua-bright/80 p-0 h-auto font-medium"
              >
                Forgot Password?
              </Button>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-ocean-primary hover:bg-ocean-deep text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              Sign In
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ocean-light/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-ocean-medium">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Button
              variant="outline"
              onClick={() => onNavigate("signup")}
              className="w-full h-12 border-2 border-ocean-primary text-ocean-primary hover:bg-ocean-primary hover:text-white font-semibold rounded-xl transition-all duration-300"
            >
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
