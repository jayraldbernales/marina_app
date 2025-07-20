import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Bell, 
  User, 
  Fish, 
  Star, 
  ShoppingCart,
  MapPin,
  Clock
} from 'lucide-react';

interface BuyerDashboardProps {
  onNavigate: (screen: string, data?: any) => void;
}

export const BuyerDashboard = ({ onNavigate }: BuyerDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Fish', icon: Fish, count: 24 },
    { name: 'Shellfish', icon: Fish, count: 18 },
    { name: 'Squid', icon: Fish, count: 12 },
    { name: 'Crab', icon: Fish, count: 8 }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: 'Fresh Red Snapper',
      price: 480,
      unit: 'kg',
      vendor: 'Maria\'s Catch',
      rating: 4.8,
      image: '🐟',
      freshness: 'Caught Today',
      location: '2.3 km away'
    },
    {
      id: 2,
      name: 'Tiger Prawns',
      price: 650,
      unit: 'kg',
      vendor: 'Ocean Harvest',
      rating: 4.9,
      image: '🦐',
      freshness: 'Ultra Fresh',
      location: '1.8 km away'
    },
    {
      id: 3,
      name: 'Blue Marlin Steak',
      price: 720,
      unit: 'kg',
      vendor: 'Deep Sea Catch',
      rating: 4.7,
      image: '🐟',
      freshness: 'Just Landed',
      location: '3.1 km away'
    }
  ];

  const promos = [
    {
      title: 'Early Bird Special',
      description: '20% off orders before 10 AM',
      color: 'bg-coral text-white'
    },
    {
      title: 'Free Delivery',
      description: 'On orders above ₱1,500',
      color: 'bg-aqua-bright text-ocean-deep'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-seafoam to-pearl">
      {/* Header */}
      <div className="bg-ocean-primary text-white p-4 rounded-b-3xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Good Morning!</h1>
            <p className="text-aqua-soft text-sm">What's fresh today?</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <Bell className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('profile')}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <User className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-medium" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fresh seafood..."
            className="pl-11 h-12 bg-white/90 border-0 rounded-2xl placeholder:text-ocean-medium"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Promo Cards */}
        <div className="animate-slide-up">
          <h2 className="text-lg font-semibold text-ocean-primary mb-3">Today's Offers</h2>
          <div className="grid grid-cols-2 gap-3">
            {promos.map((promo, index) => (
              <Card key={index} className={`${promo.color} border-0 overflow-hidden`}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{promo.title}</h3>
                  <p className="text-xs opacity-90">{promo.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="animate-slide-up">
          <h2 className="text-lg font-semibold text-ocean-primary mb-3">Categories</h2>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category, index) => (
              <Card key={index} className="bg-white hover:bg-ocean-light/20 transition-colors cursor-pointer">
                <CardContent className="p-3 text-center">
                  <category.icon className="w-8 h-8 text-ocean-primary mx-auto mb-2" />
                  <p className="text-xs font-medium text-ocean-primary">{category.name}</p>
                  <p className="text-xs text-ocean-medium">{category.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-ocean-primary">Featured Catch</h2>
            <Button variant="link" className="text-aqua-bright text-sm p-0">See All</Button>
          </div>
          
          <div className="space-y-3">
            {featuredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="bg-white hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                onClick={() => onNavigate('product-detail', product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{product.image}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-ocean-primary">{product.name}</h3>
                        <div className="text-right">
                          <p className="font-bold text-lg text-ocean-primary">₱{product.price}</p>
                          <p className="text-xs text-ocean-medium">per {product.unit}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-ocean-medium mb-2">{product.vendor}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{product.rating}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-aqua-soft text-ocean-primary">
                            {product.freshness}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs text-ocean-medium">
                          <MapPin className="w-3 h-3" />
                          <span>{product.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ocean-light/20 p-4">
        <div className="flex justify-around items-center max-w-sm mx-auto">
          <Button variant="ghost" className="flex-col h-auto p-2 text-ocean-primary">
            <Fish className="w-6 h-6 mb-1" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto p-2 text-ocean-medium">
            <Search className="w-6 h-6 mb-1" />
            <span className="text-xs">Search</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex-col h-auto p-2 text-ocean-medium"
            onClick={() => onNavigate('cart')}
          >
            <ShoppingCart className="w-6 h-6 mb-1" />
            <span className="text-xs">Cart</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto p-2 text-ocean-medium">
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-xs">Orders</span>
          </Button>
        </div>
      </div>
    </div>
  );
};