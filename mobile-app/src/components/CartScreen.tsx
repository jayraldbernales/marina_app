import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  Clock,
  CreditCard,
  Wallet
} from 'lucide-react';

interface CartScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export const CartScreen = ({ onNavigate }: CartScreenProps) => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Fresh Red Snapper',
      price: 480,
      quantity: 2,
      vendor: 'Maria\'s Catch',
      image: '🐟'
    },
    {
      id: 2,
      name: 'Tiger Prawns',
      price: 650,
      quantity: 1,
      vendor: 'Ocean Harvest',
      image: '🦐'
    }
  ]);

  const [deliveryAddress, setDeliveryAddress] = useState('123 Seaside Avenue, Coastal City');
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'downpayment'>('full');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;
  const downpaymentAmount = Math.ceil(total * 0.3); // 30% downpayment

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? {...item, quantity: newQuantity} : item
      ));
    }
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    onNavigate('order-tracking');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-seafoam to-pearl">
        <div className="bg-white/80 backdrop-blur-sm p-4 flex items-center animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('buyer-dashboard')}
            className="text-ocean-primary hover:bg-ocean-light/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-ocean-primary ml-4">Shopping Cart</h1>
        </div>

        <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-ocean-primary mb-2">Your cart is empty</h2>
          <p className="text-ocean-medium mb-6">Add some fresh seafood to get started!</p>
          <Button
            onClick={() => onNavigate('buyer-dashboard')}
            className="bg-ocean-primary hover:bg-ocean-deep text-white px-8 py-3 rounded-2xl"
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-seafoam to-pearl pb-32">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm p-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('buyer-dashboard')}
            className="text-ocean-primary hover:bg-ocean-light/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-ocean-primary ml-4">Shopping Cart</h1>
        </div>
        <span className="text-ocean-medium text-sm">{cartItems.length} items</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Cart Items */}
        <div className="space-y-3 animate-slide-up">
          {cartItems.map((item) => (
            <Card key={item.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{item.image}</div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-ocean-primary">{item.name}</h3>
                    <p className="text-sm text-ocean-medium">{item.vendor}</p>
                    <p className="font-bold text-ocean-primary">₱{item.price} per kg</p>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-coral hover:bg-coral/20 w-8 h-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border-ocean-light"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-ocean-primary">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border-ocean-light"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delivery Address */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <MapPin className="w-5 h-5 text-ocean-primary" />
              <h3 className="font-semibold text-ocean-primary">Delivery Address</h3>
            </div>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="border-ocean-light/30 focus:border-aqua-bright rounded-xl"
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-4">
            <h3 className="font-semibold text-ocean-primary mb-4">Payment Option</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod('full')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'full'
                    ? 'border-ocean-primary bg-ocean-light/20'
                    : 'border-ocean-light/30 hover:border-ocean-light/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-ocean-primary" />
                  <div className="text-left">
                    <p className="font-medium text-ocean-primary">Pay Full Amount</p>
                    <p className="text-sm text-ocean-medium">₱{total.toLocaleString()}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('downpayment')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'downpayment'
                    ? 'border-ocean-primary bg-ocean-light/20'
                    : 'border-ocean-light/30 hover:border-ocean-light/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Wallet className="w-5 h-5 text-ocean-primary" />
                  <div className="text-left">
                    <p className="font-medium text-ocean-primary">30% Downpayment</p>
                    <p className="text-sm text-ocean-medium">
                      Pay ₱{downpaymentAmount.toLocaleString()} now, ₱{(total - downpaymentAmount).toLocaleString()} on delivery
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-4">
            <h3 className="font-semibold text-ocean-primary mb-4">Order Summary</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ocean-medium">Subtotal</span>
                <span className="text-ocean-primary">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ocean-medium">Delivery Fee</span>
                <span className="text-ocean-primary">₱{deliveryFee}</span>
              </div>
              <div className="border-t border-ocean-light/30 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-ocean-primary">Total</span>
                  <span className="text-ocean-primary">₱{total.toLocaleString()}</span>
                </div>
                {paymentMethod === 'downpayment' && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-ocean-medium">Pay Now</span>
                    <span className="text-ocean-primary font-medium">₱{downpaymentAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ocean-light/20 p-4">
        <div className="max-w-sm mx-auto">
          <Button
            onClick={handleCheckout}
            className="w-full h-12 bg-ocean-primary hover:bg-ocean-deep text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            {paymentMethod === 'full' ? 'Checkout' : 'Pay Downpayment'} - ₱{(paymentMethod === 'full' ? total : downpaymentAmount).toLocaleString()}
          </Button>
        </div>
      </div>
    </div>
  );
};