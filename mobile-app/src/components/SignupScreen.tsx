import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';

interface SignupScreenProps {
  onNavigate: (screen: string) => void;
}

export const SignupScreen = ({ onNavigate }: SignupScreenProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSignup = () => {
    // In a real app, this would handle registration
    if (selectedRole === 'buyer') {
      onNavigate('buyer-dashboard');
    } else {
      onNavigate('seller-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-light via-seafoam to-aqua-soft px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8 animate-fade-in">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('welcome')}
          className="text-ocean-primary hover:bg-white/20 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-ocean-primary ml-4">Create Account</h1>
      </div>

      {/* Signup Form */}
      <div className="max-w-sm mx-auto animate-slide-up">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-ocean-primary">Join MARINA</CardTitle>
            <p className="text-ocean-medium text-sm">Start your seafood journey today</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-ocean-primary font-medium">I want to:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedRole === 'buyer' ? 'default' : 'outline'}
                  onClick={() => setSelectedRole('buyer')}
                  className={`h-12 ${selectedRole === 'buyer' 
                    ? 'bg-ocean-primary text-white' 
                    : 'border-ocean-light text-ocean-primary hover:bg-ocean-light/20'
                  }`}
                >
                  🛒 Buy Seafood
                </Button>
                <Button
                  variant={selectedRole === 'seller' ? 'default' : 'outline'}
                  onClick={() => setSelectedRole('seller')}
                  className={`h-12 ${selectedRole === 'seller' 
                    ? 'bg-ocean-primary text-white' 
                    : 'border-ocean-light text-ocean-primary hover:bg-ocean-light/20'
                  }`}
                >
                  🐟 Sell Seafood
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-ocean-primary font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-medium" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="pl-11 h-12 border-ocean-light/30 focus:border-aqua-bright rounded-xl"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-ocean-primary font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-medium" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter your email"
                    className="pl-11 h-12 border-ocean-light/30 focus:border-aqua-bright rounded-xl"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-ocean-primary font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-medium" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+63 9XX XXX XXXX"
                    className="pl-11 h-12 border-ocean-light/30 focus:border-aqua-bright rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-ocean-primary font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-medium" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a password"
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
            </div>

            {/* Terms */}
            <div className="text-center text-xs text-ocean-medium">
              By creating an account, you agree to our{' '}
              <Button variant="link" className="text-aqua-bright hover:text-aqua-bright/80 p-0 h-auto text-xs">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button variant="link" className="text-aqua-bright hover:text-aqua-bright/80 p-0 h-auto text-xs">
                Privacy Policy
              </Button>
            </div>

            {/* Signup Button */}
            <Button
              onClick={handleSignup}
              disabled={!selectedRole}
              className="w-full h-12 bg-ocean-primary hover:bg-ocean-deep text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
            >
              Create Account
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-ocean-medium text-sm">Already have an account? </span>
              <Button
                variant="link"
                onClick={() => onNavigate('login')}
                className="text-aqua-bright hover:text-aqua-bright/80 p-0 h-auto font-medium"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};