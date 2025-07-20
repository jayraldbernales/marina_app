import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  Plus, 
  Minus,
  ShoppingCart,
  Heart,
  Share
} from 'lucide-react';

interface ProductDetailProps {
  product: any;
  onNavigate: (screen: string, data?: any) => void;
}

export const ProductDetail = ({ product, onNavigate }: ProductDetailProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const productImages = ['🐟', '🐠', '🎣']; // In a real app, these would be actual images

  const productDetails = [
    { label: 'Catch Method', value: 'Sustainable Fishing', icon: Shield },
    { label: 'Storage', value: 'Ice Fresh', icon: Clock },
    { label: 'Origin', value: 'Palawan Waters', icon: MapPin }
  ];

  const handleAddToCart = () => {
    // In a real app, this would add to cart state/storage
    onNavigate('cart', { ...product, quantity });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-seafoam to-pearl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm p-4 flex items-center justify-between animate-fade-in">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('buyer-dashboard')}
          className="text-ocean-primary hover:bg-ocean-light/20 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`rounded-full ${isFavorite ? 'text-coral hover:bg-coral/20' : 'text-ocean-medium hover:bg-ocean-light/20'}`}
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-ocean-medium hover:bg-ocean-light/20 rounded-full"
          >
            <Share className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Images */}
        <Card className="bg-white overflow-hidden animate-slide-up">
          <CardContent className="p-0">
            <div className="h-64 bg-gradient-to-br from-ocean-light to-aqua-soft flex items-center justify-center">
              <div className="text-8xl animate-float">{productImages[selectedImage]}</div>
            </div>
            
            {/* Image Thumbnails */}
            <div className="p-4 flex space-x-3">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    selectedImage === index 
                      ? 'bg-ocean-primary text-white' 
                      : 'bg-ocean-light/30 text-ocean-primary hover:bg-ocean-light/50'
                  }`}
                >
                  {img}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-ocean-primary mb-2">{product.name}</h1>
              <p className="text-ocean-medium mb-3">{product.vendor}</p>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-ocean-medium text-sm">(124 reviews)</span>
                </div>
                <Badge variant="secondary" className="bg-aqua-soft text-ocean-primary">
                  {product.freshness}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-ocean-primary">₱{product.price}</p>
                  <p className="text-ocean-medium">per {product.unit}</p>
                </div>
                <div className="flex items-center space-x-1 text-ocean-medium">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{product.location}</span>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-3 mb-6">
              {productDetails.map((detail, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <detail.icon className="w-5 h-5 text-aqua-bright" />
                  <span className="text-sm text-ocean-medium">{detail.label}:</span>
                  <span className="text-sm font-medium text-ocean-primary">{detail.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-ocean-primary mb-2">Description</h3>
              <p className="text-ocean-medium text-sm leading-relaxed">
                Fresh caught {product.name.toLowerCase()} from the pristine waters of Palawan. 
                Our fishermen use sustainable methods to ensure the highest quality while 
                preserving marine ecosystems. Perfect for grilling, steaming, or your favorite seafood recipe.
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-ocean-primary">Quantity</span>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="w-10 h-10 rounded-full border-ocean-light hover:bg-ocean-light/20"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-ocean-primary">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border-ocean-light hover:bg-ocean-light/20"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ocean-light/20 p-4">
        <div className="flex items-center space-x-4 max-w-sm mx-auto">
          <div className="flex-1">
            <p className="text-xs text-ocean-medium">Total</p>
            <p className="text-xl font-bold text-ocean-primary">₱{(product.price * quantity).toLocaleString()}</p>
          </div>
          <Button
            onClick={handleAddToCart}
            className="flex-1 h-12 bg-ocean-primary hover:bg-ocean-deep text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};