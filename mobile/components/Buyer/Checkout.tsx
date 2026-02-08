import React, { useState, useCallback, useEffect } from "react";
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
} from "react-native";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
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
        .single();

      if (productError) {
        console.error(productError);
        Alert.alert("Error", "Failed to load product.");
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
          .single();

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

  const handleCheckout = async () => {
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

    try {
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Step 1: Get the user's default address ID
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

      // Step 2: Create an order with proper schema fields
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user?.id,
          vendor_user_id: product.vendor_user_id,
          address_id: addressData.address_id,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "pending" : "unpaid",
          order_status: "pending",
          total_amount: total,
          delivery_fee: deliveryFee,
          note: specialInstructions,
        })
        .select("order_id, order_number")
        .single();

      if (orderError) throw orderError;

      // Step 3: Create order item (note: your schema uses unit_price and subtotal)
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: orderData.order_id,
        product_id: product.product_id,
        quantity: quantity,
        unit_price: product.price,
        subtotal: subtotal,
      });

      if (itemError) throw itemError;

      // Step 4: Update product stock and sold quantity
      const { error: stockError } = await supabase
        .from("products")
        .update({
          stock: product.stock - quantity,
          sold_quantity: (product.sold_quantity || 0) + quantity,
        })
        .eq("product_id", product.product_id);

      if (stockError) throw stockError;

      // For COD, show success message
      if (paymentMethod === "cod") {
        Alert.alert(
          "Order Placed Successfully!",
          `Your order #${orderData.order_number} has been placed successfully. You'll pay ₱${total.toLocaleString()} upon delivery.`,
          [
            {
              text: "Track Order",
              onPress: () => router.push("/order-tracking"),
            },
            {
              text: "Continue Shopping",
              onPress: () => router.back(),
            },
          ],
        );
      } else {
        // For GCash, you would redirect to payment
        Alert.alert(
          "Proceed to Payment",
          `Order #${orderData.order_number} created. Please proceed to GCash payment.`,
          [
            {
              text: "Pay Now",
              onPress: () => {
                // Handle GCash payment integration here
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

  const handleBackToPrevious = () => {
    router.back();
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
          <View style={cartScreenStyles.emptyContent}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>📦</Text>
            <Text style={cartScreenStyles.emptyTitle}>Product not found</Text>
            <Text style={cartScreenStyles.emptyDesc}>
              The product you're looking for is unavailable.
            </Text>
            <TouchableOpacity
              style={cartScreenStyles.startShoppingBtn}
              onPress={handleBackToPrevious}
              accessibilityLabel="Start shopping"
            >
              <Text style={cartScreenStyles.startShoppingBtnText}>
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
                <Text style={cartScreenStyles.cartName}>{cartItem.name}</Text>
                <Text style={cartScreenStyles.cartVendor}>
                  {cartItem.vendor}
                </Text>
                <Text style={cartScreenStyles.cartPrice}>
                  ₱{cartItem.price.toLocaleString()} per {cartItem.unit}
                </Text>
              </View>

              {/* Price per item */}
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ marginLeft: 8, color: "#666", fontSize: 12 }}>
                  stock: {product.stock} {product.unit}
                </Text>
                {/* Quantity Controls */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
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
            onPress={handleCheckout}
            disabled={!hasHomeAddress || product.stock < quantity}
            accessibilityLabel="Place order"
          >
            <Text style={cartScreenStyles.checkoutBtnText}>
              {paymentMethod === "cod" ? "Place Order" : "Pay with GCash"} - ₱
              {total.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DirectOrderScreen;
