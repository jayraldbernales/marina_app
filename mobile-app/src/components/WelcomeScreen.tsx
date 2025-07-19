import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Waves, Fish, ShoppingCart, Store } from 'lucide-react';
import oceanHero from '@/assets/ocean-hero.jpg';

interface WelcomeScreenProps {
  onNavigate: (screen: string) => void;
}

export const WelcomeScreen = ({ onNavigate }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-deep to-ocean-primary relative overflow-hidden">
      {/* Background Ocean Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${oceanHero})` }}
      />
      
      {/* Animated Wave Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-aqua-soft/20 to-transparent animate-wave" />
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-ocean-deep/50 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-8">
        {/* Logo Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Waves className="w-16 h-16 text-aqua-bright animate-float" />
              <Fish className="w-8 h-8 text-pearl absolute top-2 right-2 animate-wave" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-pearl mb-2 tracking-wide">
            MARINA
          </h1>
          <p className="text-aqua-soft text-lg font-medium">
            Fresh Seafood Marketplace
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-2 gap-4 mb-12 w-full max-w-sm animate-slide-up">
          <Card className="p-4 bg-white/10 backdrop-blur-sm border-aqua-bright/30 text-center">
            <ShoppingCart className="w-8 h-8 text-aqua-bright mx-auto mb-2" />
            <p className="text-pearl text-sm font-medium">Buy Fresh</p>
          </Card>
          <Card className="p-4 bg-white/10 backdrop-blur-sm border-aqua-bright/30 text-center">
            <Store className="w-8 h-8 text-aqua-bright mx-auto mb-2" />
            <p className="text-pearl text-sm font-medium">Sell Local</p>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-sm space-y-4 animate-scale-in">
          <Button 
            onClick={() => onNavigate('login')}
            className="w-full h-12 bg-aqua-bright hover:bg-aqua-bright/90 text-ocean-deep font-semibold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105"
          >
            Login
          </Button>
          <Button 
            onClick={() => onNavigate('signup')}
            variant="outline"
            className="w-full h-12 border-2 border-aqua-bright text-aqua-bright hover:bg-aqua-bright hover:text-ocean-deep font-semibold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105"
          >
            Sign Up
          </Button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-aqua-soft/70 text-sm">
            Connecting coastal communities through fresh seafood
          </p>
        </div>
      </div>
    </div>
  );
};