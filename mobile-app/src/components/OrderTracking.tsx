import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle,
  Package,
  Truck,
  Home
} from 'lucide-react';

interface OrderTrackingProps {
  onNavigate: (screen: string) => void;
}

export const OrderTracking = ({ onNavigate }: OrderTrackingProps) => {
  const [currentStatus, setCurrentStatus] = useState(1);
  const [estimatedTime, setEstimatedTime] = useState(25);

  useEffect(() => {
    // Simulate order progress
    const interval = setInterval(() => {
      setEstimatedTime(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const orderDetails = {
    orderNumber: 'MRN-2024-001',
    items: [
      { name: 'Fresh Red Snapper', quantity: 2, price: 480 },
      { name: 'Tiger Prawns', quantity: 1, price: 650 }
    ],
    total: 1610,
    deliveryAddress: '123 Seaside Avenue, Coastal City',
    driverName: 'Juan Dela Cruz',
    driverPhone: '+63 9XX XXX XXXX',
    vehicleNumber: 'ABC 1234'
  };

  const statusSteps = [
    { 
      id: 1, 
      title: 'Order Confirmed', 
      subtitle: 'Your order has been confirmed',
      icon: CheckCircle,
      time: '2:30 PM',
      completed: true
    },
    { 
      id: 2, 
      title: 'Preparing Order', 
      subtitle: 'Fresh seafood being prepared',
      icon: Package,
      time: '2:45 PM',
      completed: currentStatus >= 2
    },
    { 
      id: 3, 
      title: 'Out for Delivery', 
      subtitle: 'On the way to your location',
      icon: Truck,
      time: 'In transit',
      completed: currentStatus >= 3
    },
    { 
      id: 4, 
      title: 'Delivered', 
      subtitle: 'Order delivered successfully',
      icon: Home,
      time: 'Pending',
      completed: currentStatus >= 4
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-seafoam to-pearl">
      {/* Header */}
      <div className="bg-ocean-primary text-white p-4 rounded-b-3xl animate-fade-in">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('buyer-dashboard')}
            className="text-white hover:bg-white/20 rounded-full mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Order Tracking</h1>
            <p className="text-aqua-soft text-sm">{orderDetails.orderNumber}</p>
          </div>
        </div>

        {/* Estimated Delivery */}
        <Card className="bg-white/10 backdrop-blur-sm border-aqua-bright/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-aqua-soft text-sm">Estimated Delivery</p>
                <p className="text-white font-bold text-lg">{estimatedTime} minutes</p>
              </div>
              <div className="text-4xl animate-float">🏍️</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Status */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-6">
            <h3 className="font-semibold text-ocean-primary mb-4">Order Status</h3>
            
            <div className="space-y-4">
              {statusSteps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-aqua-bright text-ocean-primary' 
                      : 'bg-ocean-light/30 text-ocean-medium'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        step.completed ? 'text-ocean-primary' : 'text-ocean-medium'
                      }`}>
                        {step.title}
                      </h4>
                      <span className="text-xs text-ocean-medium">{step.time}</span>
                    </div>
                    <p className="text-sm text-ocean-medium">{step.subtitle}</p>
                  </div>
                  
                  {step.completed && (
                    <CheckCircle className="w-5 h-5 text-aqua-bright" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Driver Info */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-4">
            <h3 className="font-semibold text-ocean-primary mb-4">Delivery Driver</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-ocean-primary to-aqua-bright rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">JD</span>
                </div>
                <div>
                  <p className="font-medium text-ocean-primary">{orderDetails.driverName}</p>
                  <p className="text-sm text-ocean-medium">{orderDetails.vehicleNumber}</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="border-ocean-primary text-ocean-primary hover:bg-ocean-primary hover:text-white rounded-full"
              >
                <Phone className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <MapPin className="w-5 h-5 text-ocean-primary" />
              <h3 className="font-semibold text-ocean-primary">Delivery Address</h3>
            </div>
            <p className="text-ocean-medium ml-8">{orderDetails.deliveryAddress}</p>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-4">
            <h3 className="font-semibold text-ocean-primary mb-4">Order Summary</h3>
            
            <div className="space-y-3">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ocean-primary">{item.name}</p>
                    <p className="text-sm text-ocean-medium">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-ocean-primary">₱{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              
              <div className="border-t border-ocean-light/30 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-ocean-primary">Total</span>
                  <span className="font-bold text-lg text-ocean-primary">₱{orderDetails.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Placeholder */}
        <Card className="bg-white animate-slide-up">
          <CardContent className="p-0">
            <div className="h-48 bg-gradient-to-br from-ocean-light to-aqua-soft rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-ocean-primary font-medium">Live Tracking Map</p>
                <p className="text-ocean-medium text-sm">Driver location updates in real-time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ocean-light/20 p-4">
        <div className="flex space-x-3 max-w-sm mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-12 border-ocean-primary text-ocean-primary hover:bg-ocean-primary hover:text-white rounded-2xl"
          >
            Contact Support
          </Button>
          <Button
            onClick={() => onNavigate('buyer-dashboard')}
            className="flex-1 h-12 bg-ocean-primary hover:bg-ocean-deep text-white rounded-2xl"
          >
            Track Another Order
          </Button>
        </div>
      </div>
    </div>
  );
};