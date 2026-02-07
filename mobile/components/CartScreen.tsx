import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation, router, useFocusEffect } from "expo-router";
import { cartScreenStyles } from "../components/styles/cartScreenStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
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
  cartItemId: string;
  cartId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  vendor: string;
  image: string | null;
  selected: boolean;
};

const CartScreen = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash">("cod");
  const [hasHomeAddress, setHasHomeAddress] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const user = useUserStore((state) => state.user);

  // Fetch cart items from database
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        return;
      }
      // Get carts for this user
      const { data: cartsData, error: cartsError } = await supabase
        .from("carts")
        .select("cart_id")
        .eq("user_id", user.id);
      if (cartsError) throw cartsError;
      if (!cartsData || cartsData.length === 0) {
        setCartItems([]);
        return;
      }
      // Get cart items with product details
      const cartIds = cartsData.map((c) => c.cart_id);
      const { data: itemsData, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          `
          cart_item_id,
          cart_id,
          product_id,
          quantity,
          products (
            product_name,
            price,
            images,
            vendor_profiles (
              shop_name
            )
          )
        `,
        )
        .in("cart_id", cartIds);
      if (itemsError) throw itemsError;
      // Transform data to match CartItem type
      const transformedItems: CartItem[] = (itemsData || []).map(
        (item: any) => ({
          cartItemId: item.cart_item_id,
          cartId: item.cart_id,
          productId: item.product_id,
          name: item.products?.product_name || "Unknown Product",
          price: parseFloat(item.products?.price || 0),
          quantity: item.quantity,
          vendor: item.products?.vendor_profiles?.shop_name || "Unknown Vendor",
          image: item.products?.images?.[0] || null,
          selected: false,
        }),
      );
      setCartItems(transformedItems);
    } catch (error: any) {
      Alert.alert("Error", `Failed to fetch cart items: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load cart on component mount and when focused
  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
    }, [user?.id]),
  );

  // Fetch home address
  useEffect(() => {
    const fetchHomeAddress = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("addresses")
        .select("full_address")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .in("address_type", ["home", "work"])
        .maybeSingle();
      if (error) {
        Alert.alert("Error", `Failed to fetch home address: ${error.message}`);
        return;
      }
      if (data) {
        setDeliveryAddress(data.full_address || "");
        setHasHomeAddress(true);
      } else {
        setDeliveryAddress("");
        setHasHomeAddress(false);
      }
    };
    fetchHomeAddress();
  }, [user?.id]);

  const subtotal = cartItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  // Toggle item selection
  const toggleSelectItem = (cartItemId: string) => {
    setCartItems(
      cartItems.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, selected: !item.selected }
          : item,
      ),
    );
  };

  // Select all items
  const selectAllItems = () => {
    const allSelected = cartItems.every((item) => item.selected);
    setCartItems(
      cartItems.map((item) => ({ ...item, selected: !allSelected })),
    );
  };

  // Update quantity in database
  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      if (newQuantity < 0) return; // Prevent negative quantities
      if (newQuantity === 0) {
        await removeItem(cartItemId);
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("cart_item_id", cartItemId);
        if (error) throw error;
        setCartItems(
          cartItems.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: newQuantity }
              : item,
          ),
        );
      }
    } catch (error: any) {
      Alert.alert("Error", `Failed to update quantity: ${error.message}`);
    }
  };

  // Delete item from cart
  const removeItem = async (cartItemId: string) => {
    try {
      setDeleting(cartItemId);
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_item_id", cartItemId);
      if (error) throw error;
      setCartItems(cartItems.filter((item) => item.cartItemId !== cartItemId));
    } catch (error: any) {
      Alert.alert("Error", `Failed to delete item: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (cartItemId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeItem(cartItemId),
        },
      ],
    );
  };

  const handleCheckout = () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      Alert.alert(
        "No Items Selected",
        "Please select at least one item to checkout.",
      );
      return;
    }
    if (!hasHomeAddress) {
      Alert.alert(
        "Delivery Address Required",
        "Please add a home delivery address to proceed with checkout.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Address",
            onPress: () => router.push("/account-information"),
          },
        ],
      );
      return;
    }
    // TODO: Implement actual order creation logic here.
    // Note: Currently, this screen allows editing the address but does not save changes back to the database.
    // In a production app, consider creating or updating an address entry in Supabase before creating the order.
    // Additionally, since this is a multi-vendor cart, group items by vendor and create separate orders for each.
    // Payment handling (especially for GCash) should integrate with a payment gateway.
    console.log("Proceed to checkout with selected items:", selectedItems);
    navigation.navigate("OrderTracking");
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  const navigateToProfileEdit = () => {
    router.push("/account-information");
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.light.background }}
      >
        <View
          style={[
            cartScreenStyles.emptyContainer,
            { justifyContent: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={{ marginTop: 12, textAlign: "center" }}>
            Loading cart...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            {cartItems.filter((item) => item.selected).length}/
            {cartItems.length} selected
          </Text>
        </View>
        <ScrollView style={{ padding: 12, marginBottom: 80, paddingTop: 10 }}>
          {/* Select All Button */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              paddingHorizontal: 12,
              marginBottom: 12,
              backgroundColor: "#f0f8ff",
              borderRadius: 8,
            }}
            onPress={selectAllItems}
          >
            <MaterialCommunityIcons
              name={
                cartItems.every((item) => item.selected)
                  ? "checkbox-marked"
                  : "checkbox-blank-outline"
              }
              size={20}
              color={COLORS.light.primary}
            />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: "600",
                color: COLORS.light.primary,
              }}
            >
              {cartItems.every((item) => item.selected)
                ? "Deselect All"
                : "Select All"}
            </Text>
          </TouchableOpacity>
          {/* Cart Items */}
          {cartItems.map((item) => (
            <CartItemComponent
              key={item.cartItemId}
              item={item}
              onToggleSelect={toggleSelectItem}
              onUpdateQuantity={updateQuantity}
              onDelete={() => handleDelete(item.cartItemId)}
              deleting={deleting}
            />
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

            {!hasHomeAddress ? (
              <>
                <View
                  style={{
                    backgroundColor: "#FFF3CD",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "#FFEEBA",
                  }}
                >
                  <Text
                    style={{
                      color: "#856404",
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    ⚠️ You need to add a home delivery address to place an
                    order.
                  </Text>
                  <TouchableOpacity
                    onPress={navigateToProfileEdit}
                    style={{
                      backgroundColor: COLORS.light.primary,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      alignSelf: "flex-end",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Add Address
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    cartScreenStyles.input,
                    { color: "#005f73", fontStyle: "italic" },
                  ]}
                  accessibilityLabel="Delivery address"
                >
                  No home delivery address set
                </Text>
              </>
            ) : (
              <Text
                style={[
                  cartScreenStyles.input,
                  !deliveryAddress && { color: "#005f73" },
                ]}
                accessibilityLabel="Delivery address"
              >
                {deliveryAddress || "No delivery address set"}
              </Text>
            )}
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
            style={[
              cartScreenStyles.checkoutBtn,
              (cartItems.filter((item) => item.selected).length === 0 ||
                !hasHomeAddress) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleCheckout}
            disabled={
              cartItems.filter((item) => item.selected).length === 0 ||
              !hasHomeAddress
            }
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

// Extracted component for better modularity and readability
const CartItemComponent = ({
  item,
  onToggleSelect,
  onUpdateQuantity,
  onDelete,
  deleting,
}: {
  item: CartItem;
  onToggleSelect: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onDelete: () => void;
  deleting: string | null;
}) => {
  const isDeleting = deleting === item.cartItemId;
  return (
    <View style={cartScreenStyles.cartCard}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={() => onToggleSelect(item.cartItemId)}
        style={{ marginRight: 12, justifyContent: "center" }}
        accessibilityLabel={`Toggle ${item.name} selection`}
      >
        <MaterialCommunityIcons
          name={item.selected ? "checkbox-marked" : "checkbox-blank-outline"}
          size={24}
          color={item.selected ? COLORS.light.primary : COLORS.light.primary}
        />
      </TouchableOpacity>
      {/* Product Image */}
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={cartScreenStyles.cartImage}
        />
      ) : (
        <View
          style={[
            cartScreenStyles.cartImage,
            {
              backgroundColor: "#e0e0e0",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Feather name="image" size={24} color="#999" />
        </View>
      )}
      {/* Product Details */}
      <View style={{ flex: 1 }}>
        <Text style={cartScreenStyles.cartName}>{item.name}</Text>
        <Text style={cartScreenStyles.cartVendor}>{item.vendor}</Text>
        <Text style={cartScreenStyles.cartPrice}>
          ₱{item.price.toLocaleString()} per kg
        </Text>
      </View>
      {/* Delete and Quantity */}
      <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
        <TouchableOpacity
          onPress={onDelete}
          disabled={isDeleting}
          style={cartScreenStyles.trashBtn}
          accessibilityLabel={`Remove ${item.name}`}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.light.coral} />
          ) : (
            <Feather name="trash-2" size={18} color={COLORS.light.coral} />
          )}
        </TouchableOpacity>
        {/* Quantity Controls */}
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
        >
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
            style={cartScreenStyles.qtyBtn}
            accessibilityLabel="Decrease quantity"
          >
            <Feather name="minus" size={16} color="#005f73" />
          </TouchableOpacity>
          <Text style={cartScreenStyles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
            style={cartScreenStyles.qtyBtn}
            accessibilityLabel="Increase quantity"
          >
            <Feather name="plus" size={16} color="#005f73" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CartScreen;
