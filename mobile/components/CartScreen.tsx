import React, { useState, useCallback, useEffect, useRef } from "react";
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
  StyleSheet,
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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "@/constants";

type RootStackParamList = {
  OrderTracking: undefined;
  BuyerDashboard: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  selected: boolean;
  vendorUserId: string;
  unit: string;
  stock: number;
};

type VendorFee = {
  fee: number;
  distance: number | null;
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

  // Delivery fee state
  const [deliveryFees, setDeliveryFees] = useState<Record<string, VendorFee>>(
    {},
  );
  const [calculatingFees, setCalculatingFees] = useState(false);
  const [buyerAddressCoords, setBuyerAddressCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Ref to track if fees have been calculated for current selection
  const calculatedForSelection = useRef<string>("");

  const navigation = useNavigation<NavigationProp>();
  const user = useUserStore((state) => state.user);

  // Calculate approximate distance (fallback)
  const calculateApproximateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
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

  // Calculate delivery fee for a vendor using RoutePH
  const calculateVendorDeliveryFee = async (
    vendorUserId: string,
    vendorLat: number,
    vendorLng: number,
    buyerLat: number,
    buyerLng: number,
  ) => {
    try {
      const response = await fetch(
        `https://routeph.com/api/osrm/v1/driving/${vendorLng},${vendorLat};${buyerLng},${buyerLat}?overview=false`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );

      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const distanceKm = data.routes[0].distance / 1000;
        let fee = distanceKm * 15;
        fee = Math.max(15, Math.min(fee, 300));

        return {
          fee: Math.round(fee),
          distance: parseFloat(distanceKm.toFixed(2)),
        };
      }
      return null;
    } catch (error) {
      console.error(`RoutePH error for vendor ${vendorUserId}:`, error);

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

  const selectedItems = cartItems.filter((item) => item.selected);

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

  const calculateSelectedVendorFees = useCallback(async () => {
    // Guard against running if already calculating
    if (calculatingFees) return;

    if (!buyerAddressCoords || selectedItems.length === 0) return;

    setCalculatingFees(true);
    const itemsByVendor = getVendorGroups();
    const newFees: Record<string, VendorFee> = {};

    try {
      for (const [vendorUserId, items] of Object.entries(itemsByVendor)) {
        const { data: vendorAddr } = await supabase
          .from("addresses")
          .select("latitude, longitude")
          .eq("user_id", vendorUserId)
          .eq("address_type", "business")
          .maybeSingle();

        if (vendorAddr?.latitude && vendorAddr?.longitude) {
          const result = await calculateVendorDeliveryFee(
            vendorUserId,
            vendorAddr.latitude,
            vendorAddr.longitude,
            buyerAddressCoords.latitude,
            buyerAddressCoords.longitude,
          );

          if (result) {
            newFees[vendorUserId] = result;
          } else {
            newFees[vendorUserId] = { fee: 50, distance: null };
          }
        } else {
          newFees[vendorUserId] = { fee: 50, distance: null };
        }
      }

      setDeliveryFees(newFees);
    } catch (error) {
      console.error("Error calculating fees:", error);
    } finally {
      setCalculatingFees(false);
    }
  }, [buyerAddressCoords, selectedItems]);

  // Fixed useEffect with infinite loop prevention
  useEffect(() => {
    const selectedIds = selectedItems
      .map((item) => item.cartItemId)
      .sort()
      .join(",");
    const hasValidData = selectedItems.length > 0 && buyerAddressCoords;

    // Only calculate if:
    // 1. We have valid data AND
    // 2. We haven't calculated for this exact selection AND
    // 3. We're not already calculating
    if (
      hasValidData &&
      calculatedForSelection.current !== selectedIds &&
      !calculatingFees
    ) {
      calculatedForSelection.current = selectedIds;
      calculateSelectedVendorFees();
    } else if (!hasValidData && Object.keys(deliveryFees).length > 0) {
      // Clear fees if no items selected
      setDeliveryFees({});
      calculatedForSelection.current = "";
    }
  }, [selectedItems, buyerAddressCoords]);

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const { data: cartsData, error: cartsError } = await supabase
        .from("carts")
        .select("cart_id")
        .eq("user_id", user.id);

      if (cartsError) throw cartsError;
      if (!cartsData || cartsData.length === 0) {
        setCartItems([]);
        return;
      }

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
            discount_percent,
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

      const transformedItems: CartItem[] = (itemsData || []).map(
        (item: any) => {
          const originalPrice = parseFloat(item.products?.price || 0);
          const discountPercent = item.products?.discount_percent || 0;
          const discountedPrice =
            discountPercent > 0
              ? originalPrice * (1 - discountPercent / 100)
              : originalPrice;

          return {
            cartItemId: item.cart_item_id,
            cartId: item.cart_id,
            productId: item.product_id,
            name: item.products?.product_name || "Unknown Product",
            price: discountedPrice,
            originalPrice: originalPrice,
            discountedPrice: discountedPrice,
            discountPercent: discountPercent,
            quantity: item.quantity,
            vendor:
              item.products?.vendor_profiles?.shop_name || "Unknown Vendor",
            image: item.products?.images?.[0] || null,
            selected: false,
            vendorUserId: item.products?.vendor_user_id,
            unit: item.products?.unit || "kg",
            stock: item.products?.stock || 0,
          };
        },
      );

      setCartItems(transformedItems);
    } catch (error: any) {
      Alert.alert("Error", `Failed to fetch cart items: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load cart on mount
  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
    }, [user?.id]),
  );

  // Fetch home address with coordinates
  useFocusEffect(
    useCallback(() => {
      const fetchHomeAddress = async () => {
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from("addresses")
            .select("full_address, address_type, latitude, longitude")
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
            if (data.latitude && data.longitude) {
              setBuyerAddressCoords({
                latitude: data.latitude,
                longitude: data.longitude,
              });
            }
          } else {
            setDeliveryAddress("");
            setHasHomeAddress(false);
            setBuyerAddressCoords(null);
          }
        } catch (error) {
          console.error("Unexpected error:", error);
          setDeliveryAddress("");
          setHasHomeAddress(false);
          setBuyerAddressCoords(null);
        }
      };

      fetchHomeAddress();
    }, [user?.id]),
  );

  const vendorGroups = getVendorGroups();
  const vendorCount = Object.keys(vendorGroups).length;

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const totalDeliveryFee = Object.values(deliveryFees).reduce(
    (sum, fee) => sum + fee.fee,
    0,
  );

  const total = subtotal + totalDeliveryFee;

  const vendorFeesList = Object.entries(deliveryFees).map(
    ([vendorUserId, fee]) => ({
      vendorUserId,
      ...fee,
    }),
  );

  const toggleSelectItem = (cartItemId: string) => {
    setCartItems(
      cartItems.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, selected: !item.selected }
          : item,
      ),
    );
  };

  const selectAllItems = () => {
    const allSelected = cartItems.every((item) => item.selected);
    setCartItems(
      cartItems.map((item) => ({ ...item, selected: !allSelected })),
    );
  };

  const handleBulkDelete = () => {
    const selectedCount = selectedItems.length;
    if (selectedCount === 0) return;

    Alert.alert(
      "Confirm Bulk Delete",
      `Are you sure you want to remove ${selectedCount} item${selectedCount > 1 ? "s" : ""} from your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => bulkRemoveItems(),
        },
      ],
    );
  };

  const bulkRemoveItems = async () => {
    try {
      const selectedCartIds = [
        ...new Set(selectedItems.map((item) => item.cartId)),
      ];

      if (selectedCartIds.length === 0) return;

      setDeleting("bulk");

      const { error } = await supabase
        .from("carts")
        .delete()
        .in("cart_id", selectedCartIds);

      if (error) throw error;

      setCartItems(cartItems.filter((item) => !item.selected));
    } catch (error: any) {
      Alert.alert("Error", `Failed to delete items: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      if (newQuantity < 0) return;

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
    } catch (error: any) {
      Alert.alert("Error", `Failed to update quantity: ${error.message}`);
    }
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

      if (paymentMethod === "cod") {
        const itemsByVendor = getVendorGroups();

        const orderPromises = Object.entries(itemsByVendor).map(
          async ([vendorUserId, items]) => {
            const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            const orderSubtotal = items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0,
            );
            const vendorDeliveryFee = deliveryFees[vendorUserId]?.fee || 50;
            const orderTotal = orderSubtotal + vendorDeliveryFee;

            const { data: orderId, error: rpcError } = await supabase.rpc(
              "place_cart_order",
              {
                p_order_number: orderNumber,
                p_user_id: user?.id,
                p_vendor_user_id: vendorUserId,
                p_address_id: addressData.address_id,
                p_payment_method: "cod",
                p_order_total: orderTotal,
                p_delivery_fee: vendorDeliveryFee,
                p_cart_item_ids: items.map((item) => item.cartItemId),
                p_note: specialInstructions || null,
                p_payment_proof_url: null,
                p_gcash_reference: null,
                p_item_data: items.map((item) => ({
                  cartItemId: item.cartItemId,
                  discountedPrice: item.price,
                })),
              },
            );
            if (rpcError) throw rpcError;
            return { orderNumber, vendorDeliveryFee, orderTotal };
          },
        );

        const orderResults = await Promise.all(orderPromises);
        const orderNumbers = orderResults.map((r) => r.orderNumber);
        const totalDeliveryFee = orderResults.reduce(
          (sum, result) => sum + result.vendorDeliveryFee,
          0,
        );
        const finalTotal = subtotal + totalDeliveryFee;

        await fetchCartItems();
        const cartIdsToDelete = [
          ...new Set(selectedItems.map((item) => item.cartId)),
        ];
        if (cartIdsToDelete.length > 0) {
          await supabase.from("carts").delete().in("cart_id", cartIdsToDelete);
        }

        Alert.alert(
          "Orders Placed Successfully!",
          `Your order${orderNumbers.length > 1 ? "s" : ""} (${orderNumbers.join(", ")}) ha${orderNumbers.length > 1 ? "ve" : "s"} been placed successfully. You'll pay ₱${finalTotal.toLocaleString()} upon delivery.`,
          [
            {
              text: "Track Orders",
              onPress: () => router.push("/(tabs)/orders"),
            },
            { text: "Continue Shopping", onPress: () => router.push("/") },
          ],
        );
      } else {
        const itemsByVendor = getVendorGroups();

        const vendorPromises = Object.keys(itemsByVendor).map(
          async (vendorUserId) => {
            const { data: vendorData } = await supabase
              .from("vendor_profiles")
              .select("shop_name, gcash_number, gcash_name")
              .eq("user_id", vendorUserId)
              .single();

            const items = itemsByVendor[vendorUserId];
            const vendorSubtotal = items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0,
            );

            return {
              vendorUserId,
              shopName: vendorData?.shop_name || "Unknown Vendor",
              gcashNumber: vendorData?.gcash_number,
              gcashName: vendorData?.gcash_name,
              subtotal: vendorSubtotal,
              deliveryFee: deliveryFees[vendorUserId]?.fee || 50,
              distance: deliveryFees[vendorUserId]?.distance,
              total: vendorSubtotal + (deliveryFees[vendorUserId]?.fee || 50),
              items: items.map((item) => ({
                cartItemId: item.cartItemId,
                productId: item.productId,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice,
                discountedPrice: item.discountedPrice,
                discountPercent: item.discountPercent,
                quantity: item.quantity,
                unit: item.unit,
              })),
            };
          },
        );

        const vendorPayments = await Promise.all(vendorPromises);

        router.push({
          pathname: "../buyer/payment-multiple",
          params: {
            orders: JSON.stringify(vendorPayments),
            addressId: addressData.address_id,
            specialInstructions: specialInstructions || "",
          },
        });
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      Alert.alert("Error", `Failed to process checkout: ${error.message}`);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  const navigateToProfileEdit = () => {
    router.push("/account-information");
  };

  const renderPrice = (item: CartItem) => {
    if (item.discountPercent > 0) {
      return (
        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>
            ₱{item.price.toLocaleString()}
          </Text>
          <Text style={styles.originalPrice}>
            ₱{item.originalPrice.toLocaleString()}
          </Text>
        </View>
      );
    }
    return (
      <Text style={styles.regularPrice}>₱{item.price.toLocaleString()}</Text>
    );
  };

  const OrderPreviewModal = () => {
    const itemsByVendor = getVendorGroups();
    const vendorCount = Object.keys(itemsByVendor).length;
    const totalDeliveryFee = Object.values(deliveryFees).reduce(
      (sum, fee) => sum + fee.fee,
      0,
    );

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
                      <View style={styles.priceRow}>
                        {item.discountPercent > 0 ? (
                          <>
                            <Text style={styles.modalDiscountedPrice}>
                              ₱{item.price.toLocaleString()}
                            </Text>
                            <Text style={styles.modalOriginalPrice}>
                              ₱{item.originalPrice.toLocaleString()}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.modalRegularPrice}>
                            ₱{item.price.toLocaleString()}
                          </Text>
                        )}
                        <Text style={styles.modalUnitText}>
                          {" "}
                          × {item.quantity} {item.unit}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

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
                    {vendorCount} vendor{vendorCount !== 1 ? "s" : ""}
                    {!calculatingFees &&
                      ` (₱${totalDeliveryFee} total delivery fee)`}
                    {calculatingFees && " (calculating fees...)"}
                  </Text>
                </View>
              </View>

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
                  {calculatingFees ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.light.primary}
                    />
                  ) : (
                    <Text style={cartScreenStyles.summaryValue}>
                      ₱{totalDeliveryFee}
                    </Text>
                  )}
                </View>
                {!calculatingFees && vendorFeesList.length > 0 && (
                  <View style={{ marginTop: 4, marginBottom: 8 }}>
                    {vendorFeesList.map((vendor, index) => (
                      <View
                        key={vendor.vendorUserId}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingHorizontal: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: "#666" }}>
                          Vendor {index + 1}{" "}
                          {vendor.distance ? `(${vendor.distance} km)` : ""}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#666" }}>
                          ₱{vendor.fee}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={cartScreenStyles.totalRow}>
                  <Text style={cartScreenStyles.totalLabel}>Total Amount</Text>
                  <Text style={cartScreenStyles.totalValue}>
                    ₱{(subtotal + totalDeliveryFee).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={cartScreenStyles.termsContainer}>
                <Text style={cartScreenStyles.termsText}>
                  By placing this order, you agree to our Terms of Service and
                  Privacy Policy. You can cancel your order within 5 minutes of
                  placing it.
                </Text>
              </View>
            </ScrollView>

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
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={cartScreenStyles.headerTitleCart}>Shopping Cart</Text>
          </View>
          <View style={cartScreenStyles.emptyState}>
            <Text style={cartScreenStyles.emptyIcon}>🛒</Text>
            <Text style={cartScreenStyles.emptyTitle}>Your cart is empty</Text>
            <Text style={cartScreenStyles.emptyDescription}>
              Add some fresh seafood to get started!
            </Text>
            <TouchableOpacity
              style={cartScreenStyles.startShoppingBtn}
              onPress={handleBackToDashboard}
            >
              <Text style={cartScreenStyles.primaryButtonText}>
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: "#f0f8ff",
                borderRadius: 8,
                flex: 1,
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

            {selectedItems.length > 0 && (
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: "#fee",
                  borderRadius: 8,
                  marginLeft: 12,
                }}
                onPress={handleBulkDelete}
                disabled={deleting === "bulk"}
              >
                {deleting === "bulk" ? (
                  <ActivityIndicator size="small" color={COLORS.light.coral} />
                ) : (
                  <>
                    <Feather
                      name="trash-2"
                      size={18}
                      color={COLORS.light.coral}
                    />
                    <Text
                      style={{
                        marginLeft: 6,
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.light.coral,
                      }}
                    >
                      Delete ({selectedItems.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {cartItems.map((item) => (
            <CartItemComponent
              key={item.cartItemId}
              item={item}
              onToggleSelect={toggleSelectItem}
              onUpdateQuantity={updateQuantity}
              renderPrice={renderPrice}
            />
          ))}

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
                    You need to add a home delivery address to place an order.
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

          <View style={cartScreenStyles.sectionCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
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
                ){calculatingFees && " (calculating...)"}
              </Text>
              {calculatingFees ? (
                <ActivityIndicator size="small" color={COLORS.light.primary} />
              ) : (
                <Text style={cartScreenStyles.summaryValue}>
                  ₱{totalDeliveryFee}
                </Text>
              )}
            </View>
            {!calculatingFees && vendorFeesList.length > 0 && (
              <View style={{ marginTop: 4, marginBottom: 8 }}>
                {vendorFeesList.map((vendor, index) => (
                  <View
                    key={vendor.vendorUserId}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: "#666" }}>
                      Vendor {index + 1}{" "}
                      {vendor.distance ? `(${vendor.distance} km)` : ""}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#666" }}>
                      ₱{vendor.fee}
                    </Text>
                  </View>
                ))}
              </View>
            )}
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

        <View style={cartScreenStyles.checkoutBar}>
          <TouchableOpacity
            style={[
              cartScreenStyles.checkoutBtn,
              (selectedItems.length === 0 ||
                !hasHomeAddress ||
                calculatingFees) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleCheckoutPreview}
            disabled={
              selectedItems.length === 0 || !hasHomeAddress || calculatingFees
            }
          >
            <Text style={cartScreenStyles.checkoutBtnText}>
              {calculatingFees
                ? "Calculating delivery..."
                : `Place Order - ₱${total.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <OrderPreviewModal />
    </SafeAreaView>
  );
};

const CartItemComponent = ({
  item,
  onToggleSelect,
  onUpdateQuantity,
  renderPrice,
}: {
  item: CartItem;
  onToggleSelect: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  renderPrice: (item: CartItem) => React.ReactElement;
}) => {
  return (
    <View style={cartScreenStyles.cartCard}>
      <TouchableOpacity
        onPress={() => onToggleSelect(item.cartItemId)}
        style={{ marginRight: 12, justifyContent: "center" }}
      >
        <MaterialCommunityIcons
          name={item.selected ? "checkbox-marked" : "checkbox-blank-outline"}
          size={24}
          color={item.selected ? COLORS.light.primary : COLORS.light.primary}
        />
      </TouchableOpacity>
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
      <View style={{ flex: 1 }}>
        <Text style={cartScreenStyles.cartName}>{item.name}</Text>
        <Text style={cartScreenStyles.cartVendor}>{item.vendor}</Text>
        {renderPrice(item)}
      </View>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
            style={cartScreenStyles.qtyBtn}
            disabled={item.quantity <= 1}
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

const styles = StyleSheet.create({
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.light.coral,
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  regularPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.light.coral,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  modalDiscountedPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.light.coral,
  },
  modalOriginalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  modalRegularPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.light.coral,
  },
  modalUnitText: {
    fontSize: 14,
    color: "#666",
  },
});

export default CartScreen;
