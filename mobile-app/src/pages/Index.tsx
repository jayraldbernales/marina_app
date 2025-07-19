import { useState } from 'react';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { LoginScreen } from '@/components/LoginScreen';
import { SignupScreen } from '@/components/SignupScreen';
import { BuyerDashboard } from '@/components/BuyerDashboard';
import { ProductDetail } from '@/components/ProductDetail';
import { CartScreen } from '@/components/CartScreen';
import { OrderTracking } from '@/components/OrderTracking';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [screenData, setScreenData] = useState<any>(null);

  const handleNavigate = (screen: string, data?: any) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'login':
        return <LoginScreen onNavigate={handleNavigate} />;
      case 'signup':
        return <SignupScreen onNavigate={handleNavigate} />;
      case 'buyer-dashboard':
        return <BuyerDashboard onNavigate={handleNavigate} />;
      case 'product-detail':
        return <ProductDetail product={screenData} onNavigate={handleNavigate} />;
      case 'cart':
        return <CartScreen onNavigate={handleNavigate} />;
      case 'order-tracking':
        return <OrderTracking onNavigate={handleNavigate} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white overflow-hidden relative">
      {renderScreen()}
    </div>
  );
};

export default Index;
