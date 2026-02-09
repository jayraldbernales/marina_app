import React, { useState, useCallback } from "react";
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
  Modal,
  TextInput,
} from "react-native";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  Entypo,
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
  vendorUserId: string;
  unit: string;
  stock: number;
};

const CartScreen = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash">("cod");
  const [hasHomeAddress, setHasHomeAddress] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showPreview, setShowPreview] = useState(false);
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
            unit,
            stock,
            vendor_user_id,
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
          vendorUserId: item.products?.vendor_user_id,
          unit: item.products?.unit || "kg",
          stock: item.products?.stock || 0,
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

  useFocusEffect(
    useCallback(() => {
      const fetchHomeAddress = async () => {
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from("addresses")
            .select("full_address, address_type")
            .eq("user_id", user.id)
            .eq("is_default", true)
            .in("address_type", ["home", "work"])
            .maybeSingle();
          if (error) {
            console.error("Error fetching address:", error);
            setDeliveryAddress("");
            setHasHomeAddress(false);
            return;
          }
          if (data) {
            setDeliveryAddress(data.full_address || "Address not specified");
            setHasHomeAddress(true);
          } else {
            setDeliveryAddress("");
            setHasHomeAddress(false);
          }
        } catch (error) {
          console.error("Unexpected error:", error);
          setDeliveryAddress("");
          setHasHomeAddress(false);
        }
      };
      fetchHomeAddress();
    }, [user?.id]),
  );

  const selectedItems = cartItems.filter((item) => item.selected);

  // Group selected items by vendor to calculate delivery fees
  const getVendorGroups = () => {
    const itemsByVendor: Record<string, CartItem[]> = {};
    selectedItems.forEach((item) => {
      if (!itemsByVendor[item.vendorUserId]) {
        itemsByVendor[item.vendorUserId] = [];
      }
      itemsByVendor[item.vendorUserId].push(item);
    });
    return itemsByVendor;
  };

  const vendorGroups = getVendorGroups();
  const vendorCount = Object.keys(vendorGroups).length;

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFeePerVendor = 50;
  const totalDeliveryFee = vendorCount * deliveryFeePerVendor;
  const total = subtotal + totalDeliveryFee;

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
        // Check stock availability
        const item = cartItems.find((i) => i.cartItemId === cartItemId);
        if (item && newQuantity > item.stock) {
          Alert.alert(
            "Insufficient Stock",
            `Only ${item.stock} ${item.unit} available.`,
          );
          return;
        }

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

  const handleCheckoutPreview = () => {
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

    // Check stock availability for all selected items
    const outOfStock = selectedItems.filter(
      (item) => item.quantity > item.stock,
    );
    if (outOfStock.length > 0) {
      Alert.alert(
        "Insufficient Stock",
        `Some items have insufficient stock: ${outOfStock.map((item) => item.name).join(", ")}`,
      );
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmOrder = async () => {
    setShowPreview(false);
    try {
      // Get the user's default address ID
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .select("address_id")
        .eq("user_id", user?.id)
        .eq("is_default", true)
        .maybeSingle();

      if (addressError) throw addressError;
      if (!addressData) {
        Alert.alert(
          "Error",
          "No default address found. Please set a default address.",
        );
        return;
      }

      // Group items by vendor
      const itemsByVendor = getVendorGroups();

      // Create orders for each vendor using a database function
      const orderPromises = Object.entries(itemsByVendor).map(
        async ([vendorUserId, items]) => {
          // Generate order number
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const orderSubtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );

          // Each vendor gets their own delivery fee
          const vendorDeliveryFee = deliveryFeePerVendor;
          const orderTotal = orderSubtotal + vendorDeliveryFee;

          // Call database function to create order with proper stock updates
          const { data: orderId, error: rpcError } = await supabase.rpc(
            "place_cart_order",
            {
              p_order_number: orderNumber,
              p_user_id: user?.id,
              p_vendor_user_id: vendorUserId,
              p_address_id: addressData.address_id,
              p_payment_method: paymentMethod,
              p_order_total: orderTotal,
              p_delivery_fee: vendorDeliveryFee,
              p_note: specialInstructions,
              p_cart_item_ids: items.map((item) => item.cartItemId),
            },
          );

          if (rpcError) {
            if (rpcError.message.includes("Insufficient stock")) {
              // Refresh cart items to get updated stock
              await fetchCartItems();
              throw new Error(
                "Some items have insufficient stock. Please adjust your cart.",
              );
            }
            throw rpcError;
          }

          return { orderNumber, vendorDeliveryFee, orderTotal };
        },
      );

      const orderResults = await Promise.all(orderPromises);
      const orderNumbers = orderResults.map((r) => r.orderNumber);

      // Calculate total for success message
      const totalDeliveryFee = orderResults.reduce(
        (sum, result) => sum + result.vendorDeliveryFee,
        0,
      );
      const finalTotal = subtotal + totalDeliveryFee;

      // Refresh cart after successful order
      await fetchCartItems();

      // Show success message
      if (paymentMethod === "cod") {
        Alert.alert(
          "Orders Placed Successfully!",
          `Your order${orderNumbers.length > 1 ? "s" : ""} (${orderNumbers.join(", ")}) ha${orderNumbers.length > 1 ? "ve" : "s"} been placed successfully. You'll pay ₱${finalTotal.toLocaleString()} upon delivery.`,
          [
            {
              text: "Track Orders",
              onPress: () => router.push("/order-tracking"),
            },
            {
              text: "Continue Shopping",
              onPress: () => router.push("/"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Proceed to Payment",
          `Order${orderNumbers.length > 1 ? "s" : ""} created. Please proceed to GCash payment.`,
          [
            {
              text: "Pay Now",
              onPress: () => {
                console.log("Redirect to GCash payment");
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      Alert.alert("Error", `Failed to place order: ${error.message}`);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  const navigateToProfileEdit = () => {
    router.push("/account-information");
  };

  // Order Preview Modal
  const OrderPreviewModal = () => {
    // Calculate delivery fees by vendor
    const itemsByVendor = getVendorGroups();
    const vendorCount = Object.keys(itemsByVendor).length;
    const totalDeliveryFee = vendorCount * deliveryFeePerVendor;

    return (
      <Modal
        visible={showPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={cartScreenStyles.modalOverlay}>
          <View style={cartScreenStyles.modalContainer}>
            <View style={cartScreenStyles.modalHeader}>
              <Text style={cartScreenStyles.modalTitle}>Review Your Order</Text>
              <TouchableOpacity
                onPress={() => setShowPreview(false)}
                style={cartScreenStyles.closeButton}
              >
                <Entypo name="cross" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={cartScreenStyles.modalContent}>
              {/* Order Details */}
              <View style={cartScreenStyles.section}>
                <Text style={cartScreenStyles.sectionHeader}>
                  Order Details ({selectedItems.length} item
                  {selectedItems.length !== 1 ? "s" : ""})
                </Text>
                {selectedItems.map((item) => (
                  <View
                    key={item.cartItemId}
                    style={cartScreenStyles.productCard}
                  >
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={cartScreenStyles.productImage}
                      />
                    ) : (
                      <View style={cartScreenStyles.placeholderImage}>
                        <Feather name="image" size={24} color="#999" />
                      </View>
                    )}
                    <View style={cartScreenStyles.productDetails}>
                      <Text style={cartScreenStyles.productName}>
                        {item.name}
                      </Text>
                      <Text style={cartScreenStyles.productVendor}>
                        {item.vendor}
                      </Text>
                      <Text style={cartScreenStyles.productPrice}>
                        ₱{item.price.toLocaleString()} × {item.quantity}{" "}
                        {item.unit}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Delivery Information */}
              <View style={cartScreenStyles.section}>
                <Text style={cartScreenStyles.sectionHeader}>
                  Delivery Information
                </Text>
                <View style={cartScreenStyles.infoRow}>
                  <Feather name="map-pin" size={16} color="#666" />
                  <Text style={cartScreenStyles.infoText}>
                    {deliveryAddress}
                  </Text>
                </View>
                <View style={cartScreenStyles.infoRow}>
                  <Feather name="clock" size={16} color="#666" />
                  <Text style={cartScreenStyles.infoText}>
                    Estimated delivery: 30-60 minutes
                  </Text>
                </View>
                <View style={cartScreenStyles.infoRow}>
                  <Feather name="shopping-bag" size={16} color="#666" />
                  <Text style={cartScreenStyles.infoText}>
                    {vendorCount} vendor{vendorCount !== 1 ? "s" : ""} (₱
                    {deliveryFeePerVendor} delivery fee per vendor)
                  </Text>
                </View>
              </View>

              {/* Payment Method */}
              <View style={cartScreenStyles.section}>
                <Text style={cartScreenStyles.sectionHeader}>
                  Payment Method
                </Text>
                <View style={cartScreenStyles.infoRow}>
                  {paymentMethod === "cod" ? (
                    <>
                      <FontAwesome5 name="wallet" size={16} color="#666" />
                      <Text style={cartScreenStyles.infoText}>
                        Cash on Delivery
                      </Text>
                    </>
                  ) : (
                    <>
                      <FontAwesome5 name="mobile-alt" size={16} color="#666" />
                      <Text style={cartScreenStyles.infoText}>GCash</Text>
                    </>
                  )}
                </View>
              </View>

              {/* Special Instructions */}
              {specialInstructions ? (
                <View style={cartScreenStyles.section}>
                  <Text style={cartScreenStyles.sectionHeader}>
                    Special Instructions
                  </Text>
                  <Text style={cartScreenStyles.instructionsText}>
                    {specialInstructions}
                  </Text>
                </View>
              ) : null}

              {/* Order Summary */}
              <View style={cartScreenStyles.section}>
                <Text style={cartScreenStyles.sectionHeader}>
                  Order Summary
                </Text>
                <View style={cartScreenStyles.summaryRow}>
                  <Text style={cartScreenStyles.summaryLabel}>Subtotal</Text>
                  <Text style={cartScreenStyles.summaryValue}>
                    ₱{subtotal.toLocaleString()}
                  </Text>
                </View>
                <View style={cartScreenStyles.summaryRow}>
                  <Text style={cartScreenStyles.summaryLabel}>
                    Delivery Fee ({vendorCount} vendor
                    {vendorCount !== 1 ? "s" : ""})
                  </Text>
                  <Text style={cartScreenStyles.summaryValue}>
                    ₱{totalDeliveryFee}
                  </Text>
                </View>
                <View style={cartScreenStyles.totalRow}>
                  <Text style={cartScreenStyles.totalLabel}>Total Amount</Text>
                  <Text style={cartScreenStyles.totalValue}>
                    ₱{(subtotal + totalDeliveryFee).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Terms and Conditions */}
              <View style={cartScreenStyles.termsContainer}>
                <Text style={cartScreenStyles.termsText}>
                  By placing this order, you agree to our Terms of Service and
                  Privacy Policy. You can cancel your order within 5 minutes of
                  placing it.
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={cartScreenStyles.modalActions}>
              <TouchableOpacity
                style={cartScreenStyles.editButton}
                onPress={() => setShowPreview(false)}
              >
                <Text style={cartScreenStyles.editButtonText}>Edit Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={cartScreenStyles.confirmButton}
                onPress={handleConfirmOrder}
              >
                <Text style={cartScreenStyles.confirmButtonText}>
                  {paymentMethod === "cod"
                    ? "Confirm Order"
                    : "Proceed to Payment"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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
            {selectedItems.length}/{cartItems.length} selected
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

          {/* Special Instructions */}
          <View style={cartScreenStyles.sectionCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialCommunityIcons
                name="note-text-outline"
                size={20}
                color={COLORS.light.primary}
              />
              <Text style={cartScreenStyles.sectionTitle}>
                Special Instructions
              </Text>
            </View>
            <TextInput
              style={[
                cartScreenStyles.input,
                {
                  height: 80,
                  textAlignVertical: "top",
                  paddingTop: 12,
                  paddingBottom: 12,
                },
              ]}
              placeholder="Add special instructions (e.g., delivery notes)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              accessibilityLabel="Special instructions for order"
            />
          </View>

          {/* Order Summary */}
          <View style={[cartScreenStyles.sectionCard, { marginBottom: 40 }]}>
            <Text style={cartScreenStyles.sectionTitle}>Order Summary</Text>
            <View style={cartScreenStyles.summaryRow}>
              <Text style={cartScreenStyles.summaryLabel}>Subtotal</Text>
              <Text style={cartScreenStyles.summaryValue}>
                ₱{subtotal.toLocaleString()}
              </Text>
            </View>
            <View style={cartScreenStyles.summaryRow}>
              <Text style={cartScreenStyles.summaryLabel}>
                Delivery Fee ({vendorCount} vendor{vendorCount !== 1 ? "s" : ""}
                )
              </Text>
              <Text style={cartScreenStyles.summaryValue}>
                ₱{totalDeliveryFee}
              </Text>
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
              (selectedItems.length === 0 || !hasHomeAddress) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleCheckoutPreview}
            disabled={selectedItems.length === 0 || !hasHomeAddress}
            accessibilityLabel="Proceed to checkout"
          >
            <Text style={cartScreenStyles.checkoutBtnText}>
              Place Order - ₱{total.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Order Preview Modal */}
      <OrderPreviewModal />
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
          ₱{item.price.toLocaleString()} per {item.unit}
        </Text>
      </View>
      {/* Delete and Quantity */}
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
            disabled={item.quantity <= 1}
            accessibilityLabel="Decrease quantity"
          >
            <Feather
              name="minus"
              size={16}
              color={item.quantity <= 1 ? "#ccc" : "#005f73"}
            />
          </TouchableOpacity>
          <Text style={cartScreenStyles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
            style={cartScreenStyles.qtyBtn}
            disabled={item.quantity >= item.stock}
            accessibilityLabel="Increase quantity"
          >
            <Feather
              name="plus"
              size={16}
              color={item.quantity >= item.stock ? "#ccc" : "#005f73"}
            />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
          Stock: {item.stock} {item.unit}
        </Text>
      </View>
    </View>
  );
};

export default CartScreen;
