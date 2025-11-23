import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { cartScreenStyles } from "../components/styles/cartScreenStyles";

// Navigation types (top-level)
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "@/constants";
type RootStackParamList = {
  OrderTracking: undefined;
  BuyerDashboard: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define for type safety/reuse
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  vendor: string;
  image: ImageSourcePropType;
};

// Constants now after types
const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: "Mayamaya",
    price: 480,
    quantity: 2,
    vendor: "Maria's Catch",
    image: require("@/assets/img/mayamaya.jpg"),
  },
  {
    id: 2,
    name: "Crab",
    price: 650,
    quantity: 1,
    vendor: "Ocean Harvest",
    image: require("@/assets/img/crab.jpg"),
  },
];

const CartScreen = () => {
  // Remove props – use hook
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [deliveryAddress, setDeliveryAddress] = useState(
    "123 Seaside Avenue, Coastal City"
  );
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash">("cod");
  const navigation = useNavigation<NavigationProp>();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;
  const gcashAmount = total;

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter((item) => item.id !== id));
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = (id: number) => {
    updateQuantity(id, 0); // DRY: Reuse update logic
  };

  const handleCheckout = () => {
    // TODO: Validate address/payment; integrate Stripe/API
    console.log("Proceed to checkout");
    navigation.navigate("OrderTracking");
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#e0fbfc" }}>
        <View style={cartScreenStyles.emptyContainer}>
          <View style={cartScreenStyles.headerBar}>
            <TouchableOpacity
              onPress={handleBackToDashboard}
              style={cartScreenStyles.headerBackBtn}
              accessibilityLabel="Back to dashboard"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={cartScreenStyles.headerTitleCart}>Shopping Cart</Text>
          </View>
          <View style={cartScreenStyles.emptyContent}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>🛒</Text>
            <Text style={cartScreenStyles.emptyTitle}>Your cart is empty</Text>
            <Text style={cartScreenStyles.emptyDesc}>
              Add some fresh seafood to get started!
            </Text>
            <TouchableOpacity
              style={cartScreenStyles.startShoppingBtn}
              onPress={handleBackToDashboard}
              accessibilityLabel="Start shopping"
            >
              <Text style={cartScreenStyles.startShoppingBtnText}>
                Start Shopping
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={cartScreenStyles.headerBar}>
          <TouchableOpacity
            onPress={handleBackToDashboard}
            style={cartScreenStyles.headerBackBtn}
            accessibilityLabel="Back to dashboard"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={cartScreenStyles.headerTitleCart}>Shopping Cart</Text>
          <Text style={cartScreenStyles.headerItemsCount}>
            {cartItems.length} items
          </Text>
        </View>
        <ScrollView style={{ padding: 16, marginBottom: 80, paddingTop: 10 }}>
          {/* Cart Items */}
          {cartItems.map((item) => (
            <View key={item.id} style={cartScreenStyles.cartCard}>
              <Image source={item.image} style={cartScreenStyles.cartImage} />

              <View style={{ flex: 1 }}>
                <Text style={cartScreenStyles.cartName}>{item.name}</Text>
                <Text style={cartScreenStyles.cartVendor}>{item.vendor}</Text>
                <Text style={cartScreenStyles.cartPrice}>
                  ₱{item.price} per kg
                </Text>
              </View>
              <View
                style={{
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={cartScreenStyles.trashBtn}
                  accessibilityLabel={`Remove ${item.name}`}
                >
                  <Feather
                    name="trash-2"
                    size={18}
                    color={COLORS.light.coral}
                  />
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    style={cartScreenStyles.qtyBtn}
                    accessibilityLabel="Decrease quantity"
                  >
                    <Feather name="minus" size={16} color="#005f73" />
                  </TouchableOpacity>
                  <Text style={cartScreenStyles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    style={cartScreenStyles.qtyBtn}
                    accessibilityLabel="Increase quantity"
                  >
                    <Feather name="plus" size={16} color="#005f73" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {/* Delivery Address */}
          <View style={cartScreenStyles.sectionCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Feather name="map-pin" size={20} color={COLORS.light.primary} />
              <Text style={cartScreenStyles.sectionTitle}>
                Delivery Address
              </Text>
            </View>
            <TextInput
              style={cartScreenStyles.input}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Enter delivery address"
              placeholderTextColor="#005f73"
              accessibilityLabel="Delivery address input"
            />
          </View>
          {/* Payment Method */}
          <View style={cartScreenStyles.sectionCard}>
            <Text style={cartScreenStyles.sectionTitle}>Payment Option</Text>

            {/* Cash on Delivery */}
            <TouchableOpacity
              style={[
                cartScreenStyles.paymentBtn,
                paymentMethod === "cod" && cartScreenStyles.paymentBtnActive,
              ]}
              onPress={() => setPaymentMethod("cod")}
              accessibilityLabel="Select Cash on Delivery"
            >
              <FontAwesome5
                name="wallet"
                size={18}
                color={COLORS.light.primary}
                style={{ marginRight: 8 }}
              />
              <View>
                <Text style={cartScreenStyles.paymentLabel}>
                  Cash on Delivery
                </Text>
                <Text style={cartScreenStyles.paymentDesc}>
                  Pay when your order arrives
                </Text>
              </View>
            </TouchableOpacity>

            {/* GCash */}
            <TouchableOpacity
              style={[
                cartScreenStyles.paymentBtn,
                paymentMethod === "gcash" && cartScreenStyles.paymentBtnActive,
              ]}
              onPress={() => setPaymentMethod("gcash")}
              accessibilityLabel="Select GCash"
            >
              <FontAwesome5
                name="mobile-alt"
                size={25}
                color={COLORS.light.primary}
                style={{ marginRight: 12 }}
              />
              <View>
                <Text style={cartScreenStyles.paymentLabel}>GCash</Text>
                <Text style={cartScreenStyles.paymentDesc}>
                  Pay now using your GCash wallet
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View style={cartScreenStyles.sectionCard}>
            <Text style={cartScreenStyles.sectionTitle}>Order Summary</Text>
            <View style={cartScreenStyles.summaryRow}>
              <Text style={cartScreenStyles.summaryLabel}>Subtotal</Text>
              <Text style={cartScreenStyles.summaryValue}>
                ₱{subtotal.toLocaleString()}
              </Text>
            </View>
            <View style={cartScreenStyles.summaryRow}>
              <Text style={cartScreenStyles.summaryLabel}>Delivery Fee</Text>
              <Text style={cartScreenStyles.summaryValue}>₱{deliveryFee}</Text>
            </View>
            <View style={cartScreenStyles.summaryDivider} />
            <View style={cartScreenStyles.summaryRow}>
              <Text
                style={[cartScreenStyles.summaryLabel, { fontWeight: "bold" }]}
              >
                Total
              </Text>
              <Text
                style={[cartScreenStyles.summaryValue, { fontWeight: "bold" }]}
              >
                ₱{total.toLocaleString()}
              </Text>
            </View>
          </View>
        </ScrollView>
        {/* Checkout Button */}
        <View style={cartScreenStyles.checkoutBar}>
          <TouchableOpacity
            style={cartScreenStyles.checkoutBtn}
            onPress={handleCheckout}
            accessibilityLabel="Proceed to checkout"
          >
            <Text style={cartScreenStyles.checkoutBtnText}>
              {paymentMethod === "cod" ? "Checkout" : "GCash Payment"} - ₱
              {total.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CartScreen;
