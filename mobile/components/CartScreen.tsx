import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";

const initialCartItems = [
  {
    id: 1,
    name: "Fresh Red Snapper",
    price: 480,
    quantity: 2,
    vendor: "Maria's Catch",
    image: "🐟",
  },
  {
    id: 2,
    name: "Tiger Prawns",
    price: 650,
    quantity: 1,
    vendor: "Ocean Harvest",
    image: "🦐",
  },
];

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
type NavigationProp = NativeStackNavigationProp<any>;

interface CartScreenProps {
  navigation: NavigationProp;
}

const CartScreen = ({ navigation }: CartScreenProps) => {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [deliveryAddress, setDeliveryAddress] = useState(
    "123 Seaside Avenue, Coastal City"
  );
  const [paymentMethod, setPaymentMethod] = useState<"full" | "downpayment">(
    "full"
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;
  const downpaymentAmount = Math.ceil(total * 0.3);

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
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    navigation.navigate("OrderTracking");
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => navigation.navigate("BuyerDashboard")}
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#005f73" />
          </TouchableOpacity>
          <Text style={styles.headerTitleCart}>Shopping Cart</Text>
        </View>
        <View style={styles.emptyContent}>
          <Text style={{ fontSize: 60, marginBottom: 12 }}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>
            Add some fresh seafood to get started!
          </Text>
          <TouchableOpacity
            style={styles.startShoppingBtn}
            onPress={() => navigation.navigate("BuyerDashboard")}
          >
            <Text style={styles.startShoppingBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#e0fbfc" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate("BuyerDashboard")}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#005f73" />
        </TouchableOpacity>
        <Text style={styles.headerTitleCart}>Shopping Cart</Text>
        <Text style={styles.headerItemsCount}>{cartItems.length} items</Text>
      </View>
      <ScrollView style={{ padding: 20, marginBottom: 100 }}>
        {/* Cart Items */}
        {cartItems.map((item) => (
          <View key={item.id} style={styles.cartCard}>
            <Text style={styles.cartImage}>{item.image}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cartName}>{item.name}</Text>
              <Text style={styles.cartVendor}>{item.vendor}</Text>
              <Text style={styles.cartPrice}>₱{item.price} per kg</Text>
            </View>
            <View
              style={{
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() => removeItem(item.id)}
                style={styles.trashBtn}
              >
                <Feather name="trash-2" size={18} color="#FF7F50" />
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
                  style={styles.qtyBtn}
                >
                  <Feather name="minus" size={16} color="#005f73" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Feather name="plus" size={16} color="#005f73" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {/* Delivery Address */}
        <View style={styles.sectionCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Feather name="map-pin" size={20} color="#005f73" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput
            style={styles.input}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Enter delivery address"
            placeholderTextColor="#005f73"
          />
        </View>
        {/* Payment Method */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Option</Text>
          <TouchableOpacity
            style={[
              styles.paymentBtn,
              paymentMethod === "full" && styles.paymentBtnActive,
            ]}
            onPress={() => setPaymentMethod("full")}
          >
            <FontAwesome5
              name="credit-card"
              size={18}
              color="#005f73"
              style={{ marginRight: 8 }}
            />
            <View>
              <Text style={styles.paymentLabel}>Pay Full Amount</Text>
              <Text style={styles.paymentDesc}>₱{total.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentBtn,
              paymentMethod === "downpayment" && styles.paymentBtnActive,
            ]}
            onPress={() => setPaymentMethod("downpayment")}
          >
            <FontAwesome5
              name="wallet"
              size={18}
              color="#005f73"
              style={{ marginRight: 8 }}
            />
            <View>
              <Text style={styles.paymentLabel}>30% Downpayment</Text>
              <Text style={styles.paymentDesc}>
                Pay ₱{downpaymentAmount.toLocaleString()} now, ₱
                {(total - downpaymentAmount).toLocaleString()} on delivery
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* Order Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ₱{subtotal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₱{deliveryFee}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>
              Total
            </Text>
            <Text style={[styles.summaryValue, { fontWeight: "bold" }]}>
              ₱{total.toLocaleString()}
            </Text>
          </View>
          {paymentMethod === "downpayment" && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pay Now</Text>
              <Text style={styles.summaryValue}>
                ₱{downpaymentAmount.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Checkout Button */}
      <View style={styles.checkoutBar}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>
            {paymentMethod === "full" ? "Checkout" : "Pay Downpayment"} - ₱
            {(paymentMethod === "full"
              ? total
              : downpaymentAmount
            ).toLocaleString()}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, backgroundColor: "#e0fbfc" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#cce3de",
  },
  headerBackBtn: { marginRight: 12 },
  headerTitleCart: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#005f73",
    flex: 1,
  },
  headerItemsCount: { color: "#0077b6", fontSize: 13 },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#005f73",
    marginBottom: 6,
  },
  emptyDesc: { color: "#0077b6", marginBottom: 18 },
  startShoppingBtn: {
    backgroundColor: "#005f73",
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  startShoppingBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cartCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    alignItems: "center",
    elevation: 2,
  },
  cartImage: { fontSize: 32, marginRight: 12 },
  cartName: { fontWeight: "bold", color: "#005f73", fontSize: 15 },
  cartVendor: { fontSize: 13, color: "#0077b6" },
  cartPrice: { fontSize: 13, color: "#005f73", marginBottom: 2 },
  trashBtn: { backgroundColor: "#fff", borderRadius: 8, padding: 4 },
  qtyBtn: {
    backgroundColor: "#e0fbfc",
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 2,
  },
  qtyText: {
    width: 24,
    textAlign: "center",
    fontWeight: "bold",
    color: "#005f73",
    fontSize: 15,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#005f73",
    fontSize: 15,
    marginBottom: 6,
    marginLeft: 6,
  },
  input: {
    backgroundColor: "#e0fbfc",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: "#005f73",
    marginTop: 2,
  },
  paymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cce3de",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  paymentBtnActive: { borderColor: "#005f73", backgroundColor: "#7fffd4" },
  paymentLabel: { fontWeight: "bold", color: "#005f73", fontSize: 14 },
  paymentDesc: { color: "#0077b6", fontSize: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: { color: "#0077b6", fontSize: 13 },
  summaryValue: { color: "#005f73", fontSize: 13 },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cce3de",
    marginVertical: 6,
  },
  checkoutBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#cce3de",
    padding: 16,
  },
  checkoutBtn: {
    backgroundColor: "#005f73",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default CartScreen;
