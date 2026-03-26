import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from "react-native-maps";
import { COLORS } from "../../constants";
import { supabase } from "@/lib/supabase";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rejected";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendor: string;
};

type CustomerInfo = {
  name: string;
  phone?: string | null;
  avatar?: string | null;
};

type RiderInfo = {
  id: string;
  name: string;
  avatar?: string | null;
  vehicle?: string;
  plateNumber?: string;
  phone?: string;
};

type OrderTrackingParams = {
  orderId: string;
  orderNumber?: string;
};

const OrderTrackingScreen = () => {
  const params = useLocalSearchParams<OrderTrackingParams>();
  const { orderId, orderNumber } = params;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [rider, setRider] = useState<RiderInfo | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<
    Array<{
      title: string;
      subtitle: string;
      time: string;
      icon: keyof typeof Ionicons.glyphMap;
      completed: boolean;
    }>
  >([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Map related state
  const [deliveryLocation, setDeliveryLocation] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  const [riderLocation, setRiderLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [riderMarkerTracksViewChanges, setRiderMarkerTracksViewChanges] =
    useState(true);

  // Route state
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Cache timeout ref for route fetching
  const routeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
    return () => {
      if (routeTimeoutRef.current) {
        clearTimeout(routeTimeoutRef.current);
      }
    };
  }, [orderId]);

  // Debounced route fetch
  useEffect(() => {
    if (riderLocation && deliveryLocation) {
      if (routeTimeoutRef.current) {
        clearTimeout(routeTimeoutRef.current);
      }
      routeTimeoutRef.current = setTimeout(() => {
        fetchRoadRoute();
      }, 500);
    }
  }, [riderLocation, deliveryLocation]);

  useEffect(() => {
    if (!riderLocation) return;

    setRiderMarkerTracksViewChanges(true);
    const timeout = setTimeout(() => {
      setRiderMarkerTracksViewChanges(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [riderLocation]);

  // Optimized: Fetch all data in parallel
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Run multiple queries in parallel
      const [orderResult, itemsResult, deliveryResult] =
        await Promise.allSettled([
          // Fetch order details with address
          supabase
            .from("orders")
            .select(
              `
          *,
          addresses!inner(
            full_address,
            latitude,
            longitude
          )
        `,
            )
            .eq("order_id", orderId)
            .single(),

          // Fetch order items
          supabase
            .from("order_items")
            .select(
              `
          *,
          products!inner(
            product_name,
            vendor_profiles!inner(
              user_id,
              shop_name
            )
          )
        `,
            )
            .eq("order_id", orderId),

          // Fetch delivery info
          supabase
            .from("deliveries")
            .select("rider_user_id, pickup_time, delivered_time")
            .eq("order_id", orderId)
            .maybeSingle(),
        ]);

      // Process order data
      if (orderResult.status === "fulfilled" && !orderResult.value.error) {
        const orderData = orderResult.value.data;
        setOrder(orderData);

        // Set delivery location
        if (orderData.addresses?.latitude && orderData.addresses?.longitude) {
          setDeliveryLocation({
            latitude: parseFloat(orderData.addresses.latitude),
            longitude: parseFloat(orderData.addresses.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        // Fetch customer info separately
        if (orderData.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, mobile_number, avatar_url")
            .eq("user_id", orderData.user_id)
            .single();

          if (profileData) {
            setCustomer({
              name: profileData.full_name || "Customer",
              phone: profileData.mobile_number,
              avatar: profileData.avatar_url,
            });
          }
        }

        // Process items
        if (itemsResult.status === "fulfilled" && !itemsResult.value.error) {
          const itemsData = itemsResult.value.data;
          const formattedItems = itemsData.map((item: any) => ({
            id: item.order_item_id,
            name: item.products.product_name,
            price: item.unit_price,
            quantity: item.quantity,
            vendor: item.products.vendor_profiles.shop_name,
          }));
          setOrderItems(formattedItems);
        }

        // Process delivery and fetch rider info
        if (
          deliveryResult.status === "fulfilled" &&
          deliveryResult.value.data?.rider_user_id
        ) {
          const deliveryData = deliveryResult.value.data;

          // Fetch rider info in parallel with status timeline
          const riderInfo = await fetchRiderInfo(deliveryData.rider_user_id);
          setRider(riderInfo);

          // Build status timeline
          buildStatusTimeline(orderData.order_status, deliveryData);
        } else {
          buildStatusTimeline(orderData.order_status, null);
        }
      } else {
        throw new Error("Failed to fetch order");
      }
    } catch (error) {
      console.error("Error in fetchOrderDetails:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };
  const fetchRiderInfo = async (
    riderUserId: string,
  ): Promise<RiderInfo | null> => {
    try {
      // Fetch rider profile and user profile in parallel
      const [riderProfileResult, userProfileResult] = await Promise.allSettled([
        supabase
          .from("rider_profiles")
          .select("vehicle_type, license_plate, current_lat, current_lng")
          .eq("user_id", riderUserId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, avatar_url, mobile_number")
          .eq("user_id", riderUserId)
          .maybeSingle(),
      ]);

      let riderProfile = null;
      let userProfile = null;

      if (
        riderProfileResult.status === "fulfilled" &&
        !riderProfileResult.value.error
      ) {
        riderProfile = riderProfileResult.value.data;
      }

      if (
        userProfileResult.status === "fulfilled" &&
        !userProfileResult.value.error
      ) {
        userProfile = userProfileResult.value.data;
      }

      if (riderProfile?.current_lat && riderProfile?.current_lng) {
        setRiderLocation({
          latitude: parseFloat(riderProfile.current_lat as any) || 0,
          longitude: parseFloat(riderProfile.current_lng as any) || 0,
        });
      }

      return {
        id: riderUserId,
        name: userProfile?.full_name || "Rider",
        avatar: userProfile?.avatar_url,
        vehicle: riderProfile?.vehicle_type,
        plateNumber: riderProfile?.license_plate,
        phone: userProfile?.mobile_number,
      };
    } catch (error) {
      console.error("Error in fetchRiderInfo:", error);
      return null;
    }
  };

  // Optimized route fetching with timeout
  const fetchRoadRoute = async () => {
    if (!riderLocation || !deliveryLocation) return;

    setCalculatingRoute(true);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        `https://routeph.com/api/osrm/v1/driving/${riderLocation.longitude},${riderLocation.latitude};${deliveryLocation.longitude},${deliveryLocation.latitude}?overview=full&geometries=geojson`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.code === "Ok" && data.routes?.length > 0) {
        const route = data.routes[0];
        if (route.geometry?.coordinates) {
          const coords = route.geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));

          setRouteCoordinates(coords);
          setRouteDistance(parseFloat((route.distance / 1000).toFixed(1)));
          setRouteDuration(Math.round(route.duration / 60));
        }
      } else {
        // Fast fallback calculation
        calculateStraightLineRoute();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Route fetch error:", error);
      calculateStraightLineRoute();
    } finally {
      setCalculatingRoute(false);
    }
  };

  const calculateStraightLineRoute = () => {
    if (!riderLocation || !deliveryLocation) return;

    const distanceKm = calculateApproximateDistance(
      riderLocation.latitude,
      riderLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude,
    );
    setRouteDistance(distanceKm);
    setRouteDuration(Math.round(distanceKm * 12));
    setRouteCoordinates([]);
  };

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
    return parseFloat((R * c).toFixed(1));
  };

  const refreshRiderLocation = async () => {
    if (!rider?.id) return;

    setRefreshingLocation(true);
    try {
      const { data: riderProfile } = await supabase
        .from("rider_profiles")
        .select("current_lat, current_lng")
        .eq("user_id", rider.id)
        .maybeSingle();

      if (riderProfile?.current_lat && riderProfile?.current_lng) {
        setRiderLocation({
          latitude: parseFloat(riderProfile.current_lat as any) || 0,
          longitude: parseFloat(riderProfile.current_lng as any) || 0,
        });
        Alert.alert("Success", "Rider location updated");
      }
    } catch (error) {
      console.error("Error refreshing rider location:", error);
      Alert.alert("Error", "Failed to refresh rider location");
    } finally {
      setRefreshingLocation(false);
    }
  };

  const buildStatusTimeline = (orderStatus: OrderStatus, deliveryData: any) => {
    const createdTime = order?.created_at
      ? new Date(order.created_at)
      : new Date();

    const statuses = [
      {
        title: "Order Confirmed",
        subtitle: "Your order has been confirmed",
        time: formatTime(createdTime),
        icon: "checkmark-circle" as const,
        completed: true,
      },
      {
        title: "Preparing Order",
        subtitle: "Vendor is preparing your items",
        time:
          !["pending", "cancelled", "rejected"].includes(orderStatus) &&
          deliveryData?.pickup_time
            ? formatTime(new Date(deliveryData.pickup_time))
            : !["pending", "cancelled", "rejected"].includes(orderStatus)
              ? "Completed"
              : "In progress",
        icon: "restaurant" as const,
        completed: !["pending", "cancelled", "rejected"].includes(orderStatus),
      },
      {
        title: "Out for Delivery",
        subtitle: "Rider is on the way to your location",
        time:
          ["shipped", "delivered"].includes(orderStatus) &&
          deliveryData?.pickup_time
            ? formatTime(new Date(deliveryData.pickup_time))
            : ["shipped", "delivered"].includes(orderStatus)
              ? "In transit"
              : "Pending",
        icon: "car" as const,
        completed: ["shipped", "delivered"].includes(orderStatus),
      },
      {
        title: "Delivered",
        subtitle: "Order delivered successfully",
        time:
          orderStatus === "delivered" && deliveryData?.delivered_time
            ? formatTime(new Date(deliveryData.delivered_time))
            : orderStatus === "delivered"
              ? "Completed"
              : "Pending",
        icon: "home" as const,
        completed: orderStatus === "delivered",
      },
    ];

    setOrderStatuses(statuses);
  };

  const formatTime = (date: Date) => {
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitialRegion = () => {
    if (deliveryLocation) return deliveryLocation;
    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  const makePhoneCall = (phoneNumber: string) => {
    if (phoneNumber && phoneNumber !== "No phone") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Error", "No phone number available");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Order Tracking</Text>
                <Text style={styles.headerSubtitle}>
                  {orderNumber || "Loading..."}
                </Text>
              </View>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Order Tracking</Text>
              <Text style={styles.headerSubtitle}>
                {order?.order_number || orderNumber}
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Section - NEW */}
        {customer && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.addressHeader}>
                <Ionicons
                  name="person"
                  size={20}
                  color={COLORS.light.primary}
                />
                <Text style={styles.addressTitle}>Customer Details</Text>
              </View>
            </View>

            <View style={styles.customerContainer}>
              <View style={styles.customerInfo}>
                {customer.avatar ? (
                  <Image
                    source={{ uri: customer.avatar }}
                    style={styles.customerAvatar}
                  />
                ) : (
                  <View style={styles.customerAvatarPlaceholder}>
                    <Text style={styles.customerAvatarText}>
                      {customer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  {customer.phone && customer.phone !== "No phone" && (
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                  )}
                </View>
              </View>

              {/* Customer Action Buttons */}
              {customer.phone && customer.phone !== "No phone" && (
                <View style={styles.customerActionButtons}>
                  <TouchableOpacity
                    style={styles.customerCallButton}
                    onPress={() => makePhoneCall(customer.phone!)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Delivery Address Section */}
        <View style={styles.sectionCard}>
          <View style={styles.addressHeader}>
            <Ionicons
              name="location-sharp"
              size={20}
              color={COLORS.light.primary}
            />
            <Text style={styles.addressTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>
            {order?.addresses?.full_address || "Address not specified"}
          </Text>
          {order?.created_at && (
            <Text style={styles.orderDate}>
              Ordered on: {formatDate(order.created_at)}
            </Text>
          )}
        </View>

        {/* Order Summary Section */}
        <View style={[styles.sectionCard, { marginBottom: 20 }]}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            {orderItems.map((item, index) => (
              <View key={item.id}>
                <View style={styles.summaryItem}>
                  <View>
                    <Text style={styles.summaryProductName}>{item.name}</Text>
                    <Text style={styles.summaryProductVendor}>
                      {item.vendor}
                    </Text>
                    <Text style={styles.summaryProductQty}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.summaryPrice}>
                    ₱{(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
                {index < orderItems.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryTotal}>Total Amount:</Text>
              <Text style={styles.summaryTotalPrice}>
                ₱{order?.total_amount?.toLocaleString() || "0"}
              </Text>
            </View>

            {order?.payment_method && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
                <Text style={styles.paymentMethodValue}>
                  {order.payment_method === "cod"
                    ? "Cash on Delivery"
                    : "GCash"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.trackButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => router.push("/support&help")}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    backgroundColor: COLORS.light.primary,
    paddingTop: 60,
    padding: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#7fffd4",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  mapContainer: {
    height: 250,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  markerDelivery: {
    backgroundColor: "#4CAF50",
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerRider: {
    backgroundColor: COLORS.light.coral,
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshLocationButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  routeInfoContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeInfoText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  scrollArea: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusItem: {
    flexDirection: "row",
    marginBottom: 20,
    position: "relative",
  },
  statusIconContainer: {
    alignItems: "center",
    marginRight: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconCompleted: {
    backgroundColor: COLORS.light.primary,
  },
  statusIconPending: {
    backgroundColor: COLORS.light.seafoam,
  },
  statusLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.light.seafoam,
    marginTop: 4,
  },
  statusLineCompleted: {
    backgroundColor: COLORS.light.primary,
  },
  statusContent: {
    flex: 1,
  },
  statusTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  statusTime: {
    fontSize: 12,
    color: "#666",
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  checkmark: {
    marginLeft: 8,
  },
  riderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  riderAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  riderAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  riderAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  riderVehicle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  riderPlate: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.seafoam,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 28,
  },
  summaryCard: {
    marginTop: 4,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  summaryProductVendor: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  summaryProductQty: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.light.seafoam,
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  summaryTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.coral,
  },
  orderDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    marginLeft: 28,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
  paymentMethodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: "#666",
  },
  paymentMethodValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 36,
  },
  supportButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light.primary,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  trackButton: {
    flex: 1,
    backgroundColor: COLORS.light.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  // New customer styles
  customerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  customerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: "#666",
  },
  customerActionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  arrivedText: {
    color: "#10b981",
    fontWeight: "600",
  },
  destinationText: {
    color: "#f59e0b",
    fontWeight: "500",
  },
});

export default OrderTrackingScreen;
