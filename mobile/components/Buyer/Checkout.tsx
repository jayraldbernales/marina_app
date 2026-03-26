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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "@/constants";
import { createNotificationWithPush } from "@/services/notificationService";

type RootStackParamList = {
  OrderTracking: undefined;
  BuyerDashboard: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define proper types
type Product = {
  product_id: string;
  product_name: string;
  description: string | null;
  price: number;
  stock: number;
  unit: string;
  harvested_at: string | null;
  images: string[] | null;
  category_id: string;
  is_active: boolean;
  vendor_user_id: string;
  discount_percent: number;
  categories: { category_name: string }[];
};

type Vendor = {
  user_id: string;
  shop_name: string;
  avatar_url: string | null;
  gcash_number: string;
};

type Address = {
  address_id: string;
  full_address: string;
  latitude: number;
  longitude: number;
  barangay: string;
};

type CartItem = {
  cartItemId: string;
  cartId: string;
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
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
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash">("cod");
  const [hasHomeAddress, setHasHomeAddress] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(initialQuantity);
  const [showPreview, setShowPreview] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [buyerAddressId, setBuyerAddressId] = useState<string | null>(null);
  const [vendorAddress, setVendorAddress] = useState<Address | null>(null);

  const navigation = useNavigation<NavigationProp>();
  const user = useUserStore((state) => state.user);

  const calculateDeliveryFee = async (
    vendorLat: number,
    vendorLng: number,
    buyerLat: number,
    buyerLng: number,
  ) => {
    try {
      // Correct RoutePH API endpoint for driving distance
      const response = await fetch(
        `https://routeph.com/api/osrm/v1/driving/${vendorLng},${vendorLat};${buyerLng},${buyerLat}?overview=false`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      // Check if the response is successful and contains routes
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        // Distance is in meters, convert to kilometers
        const distanceKm = data.routes[0].distance / 1000;

        // Calculate fee: ₱20 per km, min ₱20, max 300
        let fee = distanceKm * 15;
        fee = Math.max(15, Math.min(fee, 300));

        return {
          fee: Math.round(fee),
          distance: parseFloat(distanceKm.toFixed(2)),
        };
      }

      console.log("Unexpected API response:", data);
      return null;
    } catch (error) {
      console.error("RoutePH error:", error);

      // FALLBACK: Calculate approximate distance if API fails
      const distanceKm = calculateApproximateDistance(
        vendorLat,
        vendorLng,
        buyerLat,
        buyerLng,
      );
      let fee = distanceKm * 15;
      fee = Math.max(15, Math.min(fee, 300));

      return {
        fee: Math.round(fee),
        distance: parseFloat(distanceKm.toFixed(2)),
      };
    }
  };

  // Add this function with proper TypeScript types
  const calculateApproximateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Unified function to fetch all address data
  const fetchAddressData = async () => {
    if (!user?.id || !product?.vendor_user_id) return;

    try {
      setCalculatingFee(true);

      // Fetch buyer's default address
      const { data: buyerAddr, error: buyerError } = await supabase
        .from("addresses")
        .select("address_id, full_address, latitude, longitude, barangay")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .in("address_type", ["home", "work"])
        .maybeSingle();

      if (buyerError) {
        console.error("Error fetching buyer address:", buyerError);
        Alert.alert("Error", "Failed to load your delivery address.");
        return;
      }

      if (!buyerAddr) {
        setHasHomeAddress(false);
        setDeliveryAddress("");
        return;
      }

      setDeliveryAddress(buyerAddr.full_address || "Address not specified");
      setHasHomeAddress(true);
      setBuyerAddressId(buyerAddr.address_id);

      // Fetch vendor's default address
      const { data: vendorAddr, error: vendorError } = await supabase
        .from("addresses")
        .select("address_id, full_address, latitude, longitude, barangay")
        .eq("user_id", product.vendor_user_id)
        .eq("address_type", "business")
        .maybeSingle();

      if (vendorError) {
        console.error("Error fetching vendor address:", vendorError);
        Alert.alert("Error", "Vendor address not found.");
        return;
      }

      if (!vendorAddr) {
        Alert.alert("Error", "Vendor has no registered address.");
        return;
      }

      setVendorAddress(vendorAddr);

      // Calculate delivery fee if both addresses have coordinates
      if (
        buyerAddr.latitude &&
        buyerAddr.longitude &&
        vendorAddr.latitude &&
        vendorAddr.longitude
      ) {
        const result = await calculateDeliveryFee(
          vendorAddr.latitude,
          vendorAddr.longitude,
          buyerAddr.latitude,
          buyerAddr.longitude,
        );

        if (result) {
          setDeliveryFee(result.fee);
          setDeliveryDistance(result.distance);
        } else {
          // Keep default fee if calculation fails
          setDeliveryDistance(null);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "Failed to calculate delivery fee.");
    } finally {
      setCalculatingFee(false);
    }
  };

  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      if (!productId) {
        Alert.alert("Error", "No product selected");
        return;
      }

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
          discount_percent,
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

      // Calculate discounted price
      const original = Number(productData?.price) || 0;
      const discount = productData?.discount_percent || 0;
      setOriginalPrice(original);
      setDiscountPercent(discount);
      setDiscountedPrice(
        discount > 0 ? original * (1 - discount / 100) : original,
      );

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

        if (!vendorError && vendorData) {
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

  // Load product and address data
  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  // Load address data when product is loaded
  useEffect(() => {
    if (product) {
      fetchAddressData();
    }
  }, [product]); // Removed quantity from dependencies - not needed for distance

  // Create cart item from product
  const cartItem: CartItem | null =
    product && vendor
      ? {
          cartItemId: `direct-${product.product_id}`,
          cartId: `direct-${product.product_id}`,
          productId: product.product_id,
          name: product.product_name,
          price: discountPercent > 0 ? discountedPrice : originalPrice,
          originalPrice: originalPrice,
          discountedPrice: discountedPrice,
          discountPercent: discountPercent,
          quantity: quantity,
          vendor: vendor?.shop_name || "Unknown Vendor",
          image: product.images?.[0] || null,
          specialInstructions: specialInstructions,
          vendorUserId: product.vendor_user_id,
          unit: product.unit,
        }
      : null;

  const subtotal = cartItem ? cartItem.price * cartItem.quantity : 0;
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

  // Show preview
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

    setShowPreview(true);
  };

  // Confirm order
  const handleConfirmOrder = async () => {
    setShowPreview(false);

    if (paymentMethod === "cod") {
      try {
        if (!buyerAddressId) {
          Alert.alert("Error", "No default address found.");
          return;
        }

        const { data: orderId, error: rpcError } = await supabase.rpc(
          "place_direct_order",
          {
            p_user_id: user?.id,
            p_vendor_user_id: product?.vendor_user_id,
            p_product_id: product?.product_id,
            p_address_id: buyerAddressId,
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

        const { data: orderData, error: orderFetchError } = await supabase
          .from("orders")
          .select("order_number, total_amount")
          .eq("order_id", orderId)
          .maybeSingle();

        if (orderFetchError) throw orderFetchError;
        if (!orderData) throw new Error("Failed to get order details");

        // ========== SEND PUSH NOTIFICATIONS ==========
        try {
          // Send notification to VENDOR
          if (product?.vendor_user_id) {
            await createNotificationWithPush(
              {
                userId: product.vendor_user_id,
                userType: "vendor",
                type: "order",
                title: "🛒 New Order Received!",
                message: `Order #${orderData.order_number} - ₱${orderData.total_amount.toLocaleString()}`,
                metadata: {
                  order_id: orderId,
                  order_number: orderData.order_number,
                  total: orderData.total_amount,
                },
                relatedId: orderId,
              },
              true,
            );
            console.log("✅ Push notification sent to vendor");
          }

          // Send notification to BUYER (current user)
          if (user?.id) {
            await createNotificationWithPush(
              {
                userId: user.id,
                userType: "buyer",
                type: "order_confirmation",
                title: "Order Placed Successfully!",
                message: `Your order #${orderData.order_number} has been placed.`,
                metadata: {
                  order_id: orderId,
                  order_number: orderData.order_number,
                  total: orderData.total_amount,
                },
                relatedId: orderId,
              },
              true,
            );
            console.log("✅ Push notification sent to buyer");
          }
        } catch (pushError) {
          console.error("Error sending push notifications:", pushError);
        }
        // ========== END PUSH NOTIFICATIONS ==========

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
      // GCash
      try {
        if (!buyerAddressId) {
          Alert.alert("Error", "No default address found.");
          return;
        }

        router.push({
          pathname: "./payment",
          params: {
            productId: product?.product_id,
            vendorUserId: product?.vendor_user_id,
            quantity: quantity.toString(),
            subtotal: subtotal.toString(),
            deliveryFee: deliveryFee.toString(),
            total: total.toString(),
            specialInstructions: specialInstructions || "",
            addressId: buyerAddressId,
            discountPercent: discountPercent.toString(),
            originalPrice: originalPrice.toString(),
            discountedPrice: discountedPrice.toString(),
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

  // Preview Modal
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
                    <View style={styles.priceContainer}>
                      {discountPercent > 0 ? (
                        <>
                          <Text style={styles.discountedPrice}>
                            ₱{cartItem.price.toLocaleString()}
                          </Text>
                          <Text style={styles.originalPrice}>
                            ₱{originalPrice.toLocaleString()}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.regularPrice}>
                          ₱{cartItem.price.toLocaleString()}
                        </Text>
                      )}
                      <Text style={styles.unitText}>
                        {" "}
                        × {quantity} {cartItem.unit}
                      </Text>
                    </View>
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
                <Text style={cartScreenStyles.summaryLabel}>
                  Delivery Fee{" "}
                  {deliveryDistance ? `(${deliveryDistance} km)` : ""}
                </Text>
                {calculatingFee ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.light.primary}
                  />
                ) : (
                  <Text style={cartScreenStyles.summaryValue}>
                    ₱{deliveryFee}
                  </Text>
                )}
              </View>
              <View style={cartScreenStyles.totalRow}>
                <Text style={cartScreenStyles.totalLabel}>Total Amount</Text>
                <Text style={cartScreenStyles.totalValue}>
                  ₱{total.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Terms */}
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

  const renderProductPrice = () => {
    if (discountPercent > 0) {
      return (
        <View style={styles.priceRowContainer}>
          <Text style={styles.discountedPrice}>
            ₱{discountedPrice.toLocaleString()}
          </Text>
          <Text style={styles.originalPrice}>
            ₱{originalPrice.toLocaleString()}
          </Text>
        </View>
      );
    }
    return (
      <Text style={styles.regularPrice}>₱{originalPrice.toLocaleString()}</Text>
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

              <View style={{ flex: 1 }}>
                <Text style={cartScreenStyles.cartName}>{cartItem.name}</Text>
                <Text style={cartScreenStyles.cartVendor}>
                  {cartItem.vendor}
                </Text>
                {renderProductPrice()}
                <Text style={cartScreenStyles.cartPrice}>
                  per {cartItem.unit}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ marginLeft: 8, color: "#666", fontSize: 12 }}>
                  stock: {product.stock} {product.unit}
                </Text>

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
                  >
                    <Feather
                      name="minus"
                      size={16}
                      color={quantity <= 1 ? "#ccc" : "#005f73"}
                    />
                  </TouchableOpacity>

                  <Text style={cartScreenStyles.qtyText}>{quantity}</Text>

                  <TouchableOpacity
                    onPress={increaseQuantity}
                    style={cartScreenStyles.qtyBtn}
                    disabled={quantity >= product.stock}
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
                    style={{ color: "#856404", fontSize: 14, marginBottom: 8 }}
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
              >
                {deliveryAddress || "No delivery address set"}
              </Text>
            )}
          </View>

          {/* Payment Method */}
          <View style={cartScreenStyles.sectionCard}>
            <Text style={cartScreenStyles.sectionTitle}>Payment Option</Text>

            <TouchableOpacity
              style={[
                cartScreenStyles.paymentBtn,
                paymentMethod === "cod" && cartScreenStyles.paymentBtnActive,
              ]}
              onPress={() => setPaymentMethod("cod")}
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

            <TouchableOpacity
              style={[
                cartScreenStyles.paymentBtn,
                paymentMethod === "gcash" && cartScreenStyles.paymentBtnActive,
              ]}
              onPress={() => setPaymentMethod("gcash")}
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
                Delivery Fee{" "}
                {deliveryDistance ? `(${deliveryDistance} km)` : ""}
                {calculatingFee && " (calculating...)"}
              </Text>
              {calculatingFee ? (
                <ActivityIndicator size="small" color={COLORS.light.primary} />
              ) : (
                <Text style={cartScreenStyles.summaryValue}>
                  ₱{deliveryFee}
                </Text>
              )}
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
              (!product ||
                !hasHomeAddress ||
                product.stock < quantity ||
                calculatingFee) && {
                opacity: 0.5,
              },
            ]}
            onPress={handlePlaceOrderPreview}
            disabled={
              !product ||
              !hasHomeAddress ||
              product.stock < quantity ||
              calculatingFee
            }
          >
            <Text style={cartScreenStyles.checkoutBtnText}>
              {calculatingFee ? "Calculating delivery..." : "Place Order"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <OrderPreviewModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.light.coral,
  },
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
  },
  regularPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.light.coral,
  },
  unitText: {
    fontSize: 14,
    color: "#666",
  },
  priceRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
});

export default DirectOrderScreen;
