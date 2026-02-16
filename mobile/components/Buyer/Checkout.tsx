import React, { useState, useEffect } from "react";
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
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  Entypo,
} from "@expo/vector-icons";
import { useNavigation, router, useLocalSearchParams } from "expo-router";
import { cartScreenStyles } from "../styles/cartScreenStyles";
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
  specialInstructions?: string;
  vendorUserId: string;
  unit: string;
};
const DirectOrderScreen = () => {
  const params = useLocalSearchParams();
  const productId = params?.product_id as string;
  const initialQuantity = params?.quantity
    ? parseInt(params.quantity as string)
    : 1;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash">("cod");
  const [hasHomeAddress, setHasHomeAddress] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(initialQuantity);
  const [showPreview, setShowPreview] = useState(false); // New state for preview modal
  const navigation = useNavigation<NavigationProp>();
  const user = useUserStore((state) => state.user);
  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      if (!productId) {
        Alert.alert("Error", "No product selected");
        return;
      }
      // Fetch product with vendor info
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(
          `
          product_id,
          product_name,
          description,
          price,
          stock,
          unit,
          harvested_at,
          images,
          category_id,
          is_active,
          vendor_user_id,
          categories!inner(category_name)
        `,
        )
        .eq("product_id", productId)
        .maybeSingle();
      if (productError) {
        console.error(productError);
        Alert.alert("Error", "Failed to load product.");
        return;
      }

      if (!productData) {
        Alert.alert("Error", "Product not found.");
        return;
      }
      setProduct(productData);
      // Fetch vendor information
      if (productData.vendor_user_id) {
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendor_profiles")
          .select(
            `
            user_id,
            shop_name,
            avatar_url,
            gcash_number
          `,
          )
          .eq("user_id", productData.vendor_user_id)
          .maybeSingle();
        if (!vendorError) {
          setVendor(vendorData);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unexpected error loading product.");
    } finally {
      setLoading(false);
    }
  };
  // Fetch home address
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
  useEffect(() => {
    fetchProductDetails();
    fetchHomeAddress();
  }, [productId, user?.id]);
  // Create cart item from product
  const cartItem: CartItem | null = product
    ? {
        cartItemId: `direct-${product.product_id}`,
        cartId: `direct-${product.product_id}`,
        productId: product.product_id,
        name: product.product_name,
        price: parseFloat(product.price),
        quantity: quantity,
        vendor: vendor?.shop_name || "Unknown Vendor",
        image: product.images?.[0] || null,
        specialInstructions: specialInstructions,
        vendorUserId: product.vendor_user_id,
        unit: product.unit,
      }
    : null;
  const subtotal = cartItem ? cartItem.price * cartItem.quantity : 0;
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;
  // Quantity handlers
  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  // Show preview instead of directly placing order
  const handlePlaceOrderPreview = () => {
    if (!cartItem || !product) {
      Alert.alert("Error", "No product selected.");
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
    if (product.stock < quantity) {
      Alert.alert("Insufficient Stock", "Not enough stock available.");
      return;
    }
    // Show preview modal
    setShowPreview(true);
  };
  // Actual checkout function - UPDATED to NOT create order for GCash
  const handleConfirmOrder = async () => {
    setShowPreview(false); // Close preview modal

    // For COD - create order immediately
    if (paymentMethod === "cod") {
      try {
        // Get address
        const { data: addressData, error: addressError } = await supabase
          .from("addresses")
          .select("address_id")
          .eq("user_id", user?.id)
          .eq("is_default", true)
          .maybeSingle();

        if (addressError) throw addressError;
        if (!addressData) {
          Alert.alert("Error", "No default address found.");
          return;
        }

        // Create order
        const { data: orderId, error: rpcError } = await supabase.rpc(
          "place_direct_order",
          {
            p_user_id: user?.id,
            p_vendor_user_id: product.vendor_user_id,
            p_product_id: product.product_id,
            p_address_id: addressData.address_id,
            p_quantity: quantity,
            p_payment_method: "cod",
            p_order_total: total,
            p_delivery_fee: deliveryFee,
            p_note: specialInstructions || null,
            p_payment_proof_url: null,
            p_gcash_reference: null,
          },
        );

        if (rpcError) {
          if (rpcError.message.includes("Insufficient stock")) {
            Alert.alert("Insufficient Stock", "Please adjust quantity.");
            await fetchProductDetails();
            return;
          }
          throw rpcError;
        }

        // Get order details
        const { data: orderData, error: orderFetchError } = await supabase
          .from("orders")
          .select("order_number, total_amount")
          .eq("order_id", orderId)
          .maybeSingle();

        if (orderFetchError) throw orderFetchError;
        if (!orderData) throw new Error("Failed to get order details");

        // Update local state
        setProduct((prev: any) => ({
          ...prev,
          stock: prev.stock - quantity,
          sold_quantity: (prev.sold_quantity || 0) + quantity,
        }));

        setQuantity(1);
        setSpecialInstructions("");

        Alert.alert(
          "Order Placed Successfully!",
          `Your order #${orderData.order_number} has been placed. You'll pay ₱${orderData.total_amount.toLocaleString()} upon delivery.`,
          [
            {
              text: "Track Order",
              onPress: () => router.push("/(tabs)/orders"),
            },
            {
              text: "Continue Shopping",
              onPress: () => router.push("/(tabs)"),
            },
          ],
        );
      } catch (error: any) {
        console.error("Checkout error:", error);
        Alert.alert("Error", `Failed to place order: ${error.message}`);
      }
    } else {
      // For GCash - DO NOT CREATE ORDER, just navigate to payment screen
      try {
        // Get address
        const { data: addressData, error: addressError } = await supabase
          .from("addresses")
          .select("address_id")
          .eq("user_id", user?.id)
          .eq("is_default", true)
          .maybeSingle();

        if (addressError) throw addressError;
        if (!addressData) {
          Alert.alert("Error", "No default address found.");
          return;
        }

        router.push({
          pathname: "./payment",
          params: {
            productId: product.product_id,
            vendorUserId: product.vendor_user_id,
            quantity: quantity.toString(),
            subtotal: subtotal.toString(),
            deliveryFee: deliveryFee.toString(),
            total: total.toString(),
            specialInstructions: specialInstructions || "",
            addressId: addressData.address_id,
          },
        });
      } catch (error: any) {
        console.error("Error:", error);
        Alert.alert("Error", `Failed to prepare payment: ${error.message}`);
      }
    }
  };

  const handleBackToPrevious = () => {
    router.back();
  };

  const navigateToProfileEdit = () => {
    router.push("/account-information");
  };
  // Preview Modal Component
  const OrderPreviewModal = () => (
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
              <Text style={cartScreenStyles.sectionHeader}>Order Details</Text>
              {cartItem && (
                <View style={cartScreenStyles.productCard}>
                  {cartItem.image ? (
                    <Image
                      source={{ uri: cartItem.image }}
                      style={cartScreenStyles.productImage}
                    />
                  ) : (
                    <View style={cartScreenStyles.placeholderImage}>
                      <Feather name="image" size={24} color="#999" />
                    </View>
                  )}
                  <View style={cartScreenStyles.productDetails}>
                    <Text style={cartScreenStyles.productName}>
                      {cartItem.name}
                    </Text>
                    <Text style={cartScreenStyles.productVendor}>
                      {cartItem.vendor}
                    </Text>
                    <Text style={cartScreenStyles.productPrice}>
                      ₱{cartItem.price.toLocaleString()} × {quantity}{" "}
                      {cartItem.unit}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            {/* Delivery Information */}
            <View style={cartScreenStyles.section}>
              <Text style={cartScreenStyles.sectionHeader}>
                Delivery Information
              </Text>
              <View style={cartScreenStyles.infoRow}>
                <Feather name="map-pin" size={16} color="#666" />
                <Text style={cartScreenStyles.infoText}>{deliveryAddress}</Text>
              </View>
              <View style={cartScreenStyles.infoRow}>
                <Feather name="clock" size={16} color="#666" />
                <Text style={cartScreenStyles.infoText}>
                  Estimated delivery: 30-60 minutes
                </Text>
              </View>
            </View>
            {/* Payment Method */}
            <View style={cartScreenStyles.section}>
              <Text style={cartScreenStyles.sectionHeader}>Payment Method</Text>
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
              <Text style={cartScreenStyles.sectionHeader}>Order Summary</Text>
              <View style={cartScreenStyles.summaryRow}>
                <Text style={cartScreenStyles.summaryLabel}>Subtotal</Text>
                <Text style={cartScreenStyles.summaryValue}>
                  ₱{subtotal.toLocaleString()}
                </Text>
              </View>
              <View style={cartScreenStyles.summaryRow}>
                <Text style={cartScreenStyles.summaryLabel}>Delivery Fee</Text>
                <Text style={cartScreenStyles.summaryValue}>
                  ₱{deliveryFee}
                </Text>
              </View>
              <View style={cartScreenStyles.totalRow}>
                <Text style={cartScreenStyles.totalLabel}>Total Amount</Text>
                <Text style={cartScreenStyles.totalValue}>
                  ₱{total.toLocaleString()}
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
  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.light.background }}
      >
        <View
          style={[
            cartScreenStyles.emptyContainer,
            { justifyContent: "center" as const },
          ]}
        >
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={{ marginTop: 12, textAlign: "center" }}>
            Loading product...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#e0fbfc" }}>
        <View style={cartScreenStyles.emptyContainer}>
          <View style={cartScreenStyles.headerBar}>
            <TouchableOpacity
              onPress={handleBackToPrevious}
              style={cartScreenStyles.headerBackBtn}
              accessibilityLabel="Back to dashboard"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={cartScreenStyles.headerTitleCart}>Direct Order</Text>
          </View>
          <View style={cartScreenStyles.emptyState}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>📦</Text>
            <Text style={cartScreenStyles.emptyTitle}>Product not found</Text>
            <Text style={cartScreenStyles.emptyDescription}>
              The product you're looking for is unavailable.
            </Text>
            <TouchableOpacity
              style={cartScreenStyles.startShoppingBtn}
              onPress={handleBackToPrevious}
              accessibilityLabel="Start shopping"
            >
              <Text style={cartScreenStyles.primaryButtonText}>
                Continue Shopping
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
            onPress={handleBackToPrevious}
            style={cartScreenStyles.headerBackBtn}
            accessibilityLabel="Back to dashboard"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={cartScreenStyles.headerTitleCart}>Direct Order</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ padding: 12, marginBottom: 80, paddingTop: 10 }}>
          {/* Product Item */}
          {cartItem && (
            <View style={cartScreenStyles.cartCard}>
              {/* Product Image */}
              {cartItem.image ? (
                <Image
                  source={{ uri: cartItem.image }}
                  style={cartScreenStyles.cartImage}
                />
              ) : (
                <View
                  style={[
                    cartScreenStyles.cartImage,
                    {
                      backgroundColor: "#e0e0e0",
                      justifyContent: "center" as const,
                      alignItems: "center" as const,
                    },
                  ]}
                >
                  <Feather name="image" size={24} color="#999" />
                </View>
              )}
              {/* Product Details */}
              <View style={{ flex: 1 }}>
                <Text style={cartScreenStyles.cartName}>{cartItem.name}</Text>
                <Text style={cartScreenStyles.cartVendor}>
                  {cartItem.vendor}
                </Text>
                <Text style={cartScreenStyles.cartPrice}>
                  ₱{cartItem.price.toLocaleString()} per {cartItem.unit}
                </Text>
              </View>
              {/* Price per item */}
              <View style={{ alignItems: "flex-end" as const }}>
                <Text style={{ marginLeft: 8, color: "#666", fontSize: 12 }}>
                  stock: {product.stock} {product.unit}
                </Text>
                {/* Quantity Controls */}
                <View
                  style={{
                    flexDirection: "row" as const,
                    alignItems: "center" as const,
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={decreaseQuantity}
                    style={cartScreenStyles.qtyBtn}
                    disabled={quantity <= 1}
                    accessibilityLabel="Decrease quantity"
                  >
                    <Feather
                      name="minus"
                      size={16}
                      color={quantity <= 1 ? "#ccc" : "#005f73"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={cartScreenStyles.qtyText}>{quantity}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={increaseQuantity}
                    style={cartScreenStyles.qtyBtn}
                    disabled={quantity >= product.stock}
                    accessibilityLabel="Increase quantity"
                  >
                    <Feather
                      name="plus"
                      size={16}
                      color={quantity >= product.stock ? "#ccc" : "#005f73"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          {/* Delivery Address */}
          <View style={cartScreenStyles.sectionCard}>
            <View
              style={{
                flexDirection: "row" as const,
                alignItems: "center" as const,
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
                      alignSelf: "flex-end" as const,
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
                flexDirection: "row" as const,
                alignItems: "center" as const,
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
                  textAlignVertical: "top" as const,
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
        <View style={[cartScreenStyles.checkoutBar, { marginBottom: 36 }]}>
          <TouchableOpacity
            style={[
              cartScreenStyles.checkoutBtn,
              (!hasHomeAddress || product.stock < quantity) && {
                opacity: 0.5,
              },
            ]}
            onPress={handlePlaceOrderPreview} // Changed to show preview
            disabled={!hasHomeAddress || product.stock < quantity}
            accessibilityLabel="Place order"
          >
            <Text style={cartScreenStyles.checkoutBtnText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* Order Preview Modal */}
      <OrderPreviewModal />
    </SafeAreaView>
  );
};

export default DirectOrderScreen;
