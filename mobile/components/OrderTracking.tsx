import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from "react-native-maps";
import { COLORS } from "../constants";
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

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Fetch route when rider location changes
  useEffect(() => {
    if (riderLocation && deliveryLocation) {
      fetchRoadRoute();
    }
  }, [riderLocation, deliveryLocation]);

  useEffect(() => {
    if (!riderLocation) {
      return;
    }

    // allow one render pass while the custom marker view loads
    setRiderMarkerTracksViewChanges(true);
    const timeout = setTimeout(() => {
      setRiderMarkerTracksViewChanges(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [riderLocation]);

  const fetchRiderInfo = async (
    riderUserId: string,
  ): Promise<RiderInfo | null> => {
    try {
      // Get rider profile with vehicle type
      const { data: riderProfile, error: riderError } = await supabase
        .from("rider_profiles")
        .select("vehicle_type, license_plate, current_lat, current_lng")
        .eq("user_id", riderUserId)
        .maybeSingle();

      if (riderError) {
        console.error("Error fetching rider profile:", riderError);
        return null;
      }

      // Get user profile with name and avatar
      const { data: userProfile, error: userError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, mobile_number")
        .eq("user_id", riderUserId)
        .maybeSingle();

      if (userError || !userProfile) {
        console.error("Error fetching user profile:", userError);
        return null;
      }

      // Set rider location if available
      if (riderProfile?.current_lat && riderProfile?.current_lng) {
        const newRiderLocation = {
          latitude: parseFloat(riderProfile.current_lat as any) || 0,
          longitude: parseFloat(riderProfile.current_lng as any) || 0,
        };

        setRiderLocation((prev) => {
          if (
            prev?.latitude === newRiderLocation.latitude &&
            prev?.longitude === newRiderLocation.longitude
          ) {
            return prev; // avoid redundant updates to prevent marker flicker
          }
          return newRiderLocation;
        });
      }

      return {
        id: riderUserId,
        name: userProfile.full_name || "Rider",
        avatar: userProfile.avatar_url,
        vehicle: riderProfile?.vehicle_type,
        plateNumber: riderProfile?.license_plate,
        phone: userProfile.mobile_number,
      };
    } catch (error) {
      console.error("Error in fetchRiderInfo:", error);
      return null;
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order details with address including coordinates
      const { data: orderData, error: orderError } = await supabase
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
        .single();

      if (orderError) {
        console.error("Order fetch error:", orderError);
        throw orderError;
      }
      setOrder(orderData);

      // Set delivery location from address
      if (orderData.addresses?.latitude && orderData.addresses?.longitude) {
        setDeliveryLocation({
          latitude: parseFloat(orderData.addresses.latitude),
          longitude: parseFloat(orderData.addresses.longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
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
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Items fetch error:", itemsError);
        throw itemsError;
      }

      const formattedItems = itemsData.map((item: any) => ({
        id: item.order_item_id,
        name: item.products.product_name,
        price: item.unit_price,
        quantity: item.quantity,
        vendor: item.products.vendor_profiles.shop_name,
      }));
      setOrderItems(formattedItems);

      // REMOVED: Vendor location fetching code

      // Fetch delivery to get rider_user_id
      const { data: deliveryData, error: deliveryError } = await supabase
        .from("deliveries")
        .select("rider_user_id, pickup_time, delivered_time")
        .eq("order_id", orderId)
        .maybeSingle();

      if (deliveryError) {
        console.error("Delivery fetch error:", deliveryError);
      } else if (deliveryData?.rider_user_id) {
        // Fetch rider info using the rider_user_id
        const riderInfo = await fetchRiderInfo(deliveryData.rider_user_id);
        setRider(riderInfo);
      }

      // Build status timeline
      buildStatusTimeline(orderData.order_status, deliveryData);
    } catch (error) {
      console.error("Error in fetchOrderDetails:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch road route from RoutePH
  const fetchRoadRoute = async () => {
    if (!riderLocation || !deliveryLocation) return;

    setCalculatingRoute(true);
    try {
      // RoutePH API endpoint for driving route
      const response = await fetch(
        `https://routeph.com/api/osrm/v1/driving/${riderLocation.longitude},${riderLocation.latitude};${deliveryLocation.longitude},${deliveryLocation.latitude}?overview=full&geometries=geojson`,
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
        const route = data.routes[0];

        // Extract coordinates from GeoJSON
        if (route.geometry && route.geometry.coordinates) {
          // Convert [lng, lat] to {latitude, longitude}
          const coords = route.geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));

          setRouteCoordinates(coords);

          // Distance in meters, convert to km
          const distanceKm = route.distance / 1000;
          setRouteDistance(parseFloat(distanceKm.toFixed(1)));

          // Duration in seconds, convert to minutes
          const durationMin = Math.round(route.duration / 60);
          setRouteDuration(durationMin);
        }
      } else {
        console.log("Route not found, using fallback calculation");
        // Fallback to straight line if no route found
        setRouteCoordinates([]);

        // Calculate approximate straight-line distance
        const straightDistance = calculateApproximateDistance(
          riderLocation.latitude,
          riderLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude,
        );
        setRouteDistance(straightDistance);
        setRouteDuration(Math.round(straightDistance * 12)); // Rough estimate: 12 min per km
      }
    } catch (error) {
      console.error("RoutePH error:", error);

      // Fallback: calculate approximate straight-line distance
      if (riderLocation && deliveryLocation) {
        const distanceKm = calculateApproximateDistance(
          riderLocation.latitude,
          riderLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude,
        );
        setRouteDistance(distanceKm);
        setRouteDuration(Math.round(distanceKm * 12));
        setRouteCoordinates([]);
      }
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Helper function to calculate approximate straight-line distance
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
        const newRiderLocation = {
          latitude: parseFloat(riderProfile.current_lat as any) || 0,
          longitude: parseFloat(riderProfile.current_lng as any) || 0,
        };

        setRiderLocation((prev) => {
          if (
            prev?.latitude === newRiderLocation.latitude &&
            prev?.longitude === newRiderLocation.longitude
          ) {
            return prev;
          }
          return newRiderLocation;
        });

        // Route will automatically refetch due to the useEffect
        Alert.alert("Success", "Rider location updated");
      } else {
        Alert.alert("Info", "Rider location not available");
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

    const statuses: Array<{
      title: string;
      subtitle: string;
      time: string;
      icon: keyof typeof Ionicons.glyphMap;
      completed: boolean;
    }> = [];

    // Order Confirmed - always completed
    statuses.push({
      title: "Order Confirmed",
      subtitle: "Your order has been confirmed",
      time: formatTime(createdTime),
      icon: "checkmark-circle",
      completed: true,
    });

    // Preparing - completed if status is past pending
    const preparingCompleted = !["pending", "cancelled", "rejected"].includes(
      orderStatus,
    );
    statuses.push({
      title: "Preparing Order",
      subtitle: "Vendor is preparing your items",
      time:
        preparingCompleted && deliveryData?.pickup_time
          ? formatTime(new Date(deliveryData.pickup_time))
          : preparingCompleted
            ? "Completed"
            : "In progress",
      icon: "restaurant",
      completed: preparingCompleted,
    });

    // Out for Delivery - completed if status is shipped or delivered
    const shippedCompleted = ["shipped", "delivered"].includes(orderStatus);
    statuses.push({
      title: "Out for Delivery",
      subtitle: "Rider is on the way to your location",
      time:
        shippedCompleted && deliveryData?.pickup_time
          ? formatTime(new Date(deliveryData.pickup_time))
          : shippedCompleted
            ? "In transit"
            : "Pending",
      icon: "car",
      completed: shippedCompleted,
    });

    // Delivered - completed only if status is delivered
    const deliveredCompleted = orderStatus === "delivered";
    statuses.push({
      title: "Delivered",
      subtitle: "Order delivered successfully",
      time:
        deliveredCompleted && deliveryData?.delivered_time
          ? formatTime(new Date(deliveryData.delivered_time))
          : deliveredCompleted
            ? "Completed"
            : "Pending",
      icon: "home",
      completed: deliveredCompleted,
    });

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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCallRider = () => {
    if (rider?.phone) {
      Linking.openURL(`tel:${rider.phone}`);
    } else {
      Alert.alert("Error", "Rider phone number not available");
    }
  };

  const handleViewRiderProfile = () => {
    if (rider?.id) {
      router.push({
        pathname: "../buyer/view-rider",
        params: { rider_user_id: rider.id },
      });
    }
  };

  const getInitialRegion = () => {
    if (deliveryLocation) {
      return deliveryLocation;
    }

    // Default to a central location in the Philippines if no delivery location
    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
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
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={{ marginTop: 12 }}>Loading order details...</Text>
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
        {/* Order Status Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.statusContainer}>
            {orderStatuses.map((status, index) => (
              <View key={index} style={styles.statusItem}>
                <View style={styles.statusIconContainer}>
                  <View
                    style={[
                      styles.statusIcon,
                      status.completed
                        ? styles.statusIconCompleted
                        : styles.statusIconPending,
                    ]}
                  >
                    <Ionicons
                      name={status.icon}
                      size={20}
                      color={status.completed ? "#fff" : COLORS.light.primary}
                    />
                  </View>
                  {index < orderStatuses.length - 1 && (
                    <View
                      style={[
                        styles.statusLine,
                        status.completed && styles.statusLineCompleted,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.statusContent}>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusTitle}>{status.title}</Text>
                    <Text style={styles.statusTime}>{status.time}</Text>
                  </View>
                  <Text style={styles.statusSubtitle}>{status.subtitle}</Text>
                </View>
                {status.completed && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="green"
                    style={styles.checkmark}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Rider Section - Only show if rider assigned */}
        {rider && (
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={handleViewRiderProfile}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Rider</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.riderCard}>
              <View style={styles.riderInfo}>
                {rider.avatar ? (
                  <Image
                    source={{ uri: rider.avatar }}
                    style={styles.riderAvatarImage}
                  />
                ) : (
                  <View style={styles.riderAvatarPlaceholder}>
                    <Text style={styles.riderAvatarText}>
                      {rider.name.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.riderDetails}>
                  <Text style={styles.riderName}>{rider.name}</Text>
                  {rider.vehicle && (
                    <Text style={styles.riderVehicle}>{rider.vehicle}</Text>
                  )}
                  {rider.plateNumber && (
                    <Text style={styles.riderPlate}>
                      Plate: {rider.plateNumber}
                    </Text>
                  )}
                </View>
              </View>
              {rider.phone && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCallRider}
                >
                  <Ionicons
                    name="call"
                    size={24}
                    color={COLORS.light.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
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

        {/* Map View */}
        {deliveryLocation && (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={getInitialRegion()}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              showsBuildings={false}
              showsTraffic={false}
              showsIndoors={false}
              onMapReady={() => setMapReady(true)}
            >
              {/* Delivery location marker */}
              {deliveryLocation && (
                <Marker
                  coordinate={{
                    latitude: deliveryLocation.latitude,
                    longitude: deliveryLocation.longitude,
                  }}
                  title="Delivery Location"
                  description={order?.addresses?.full_address}
                >
                  <View style={styles.markerDelivery}>
                    <Ionicons name="home" size={14} color="#fff" />
                  </View>
                </Marker>
              )}

              {/* REMOVED: Vendor location marker */}

              {/* Rider location marker */}
              {riderLocation && (
                <Marker
                  coordinate={riderLocation}
                  title={rider?.name || "Rider"}
                  description="Current location"
                  tracksViewChanges={riderMarkerTracksViewChanges}
                >
                  <View style={styles.markerRider}>
                    <Ionicons name="bicycle" size={14} color="#fff" />
                  </View>
                </Marker>
              )}

              {/* Road path between rider and delivery location */}
              {routeCoordinates.length > 0 && mapReady && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#FF0000"
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapView>

            {/* Refresh location button */}
            {rider && (
              <TouchableOpacity
                style={styles.refreshLocationButton}
                onPress={refreshRiderLocation}
                disabled={refreshingLocation}
              >
                {refreshingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.light.primary}
                  />
                ) : (
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={COLORS.light.primary}
                  />
                )}
              </TouchableOpacity>
            )}

            {/* Route info indicator */}
            {riderLocation && deliveryLocation && (
              <View style={styles.routeInfoContainer}>
                {calculatingRoute ? (
                  <View style={styles.routeInfo}>
                    <ActivityIndicator size="small" color="#FF0000" />
                    <Text style={styles.routeInfoText}>
                      Calculating route...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.routeInfo}>
                    {(() => {
                      // Check if we have valid distance/duration
                      const hasValidRoute =
                        routeDistance !== null &&
                        routeDuration !== null &&
                        routeDistance > 0;

                      // Check if at destination (very close or zero distance)
                      const isAtDestination =
                        routeDistance === 0 ||
                        (routeDistance && routeDistance < 0.01);

                      if (isAtDestination) {
                        return (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#10b981"
                            />
                            <Text
                              style={[styles.routeInfoText, styles.arrivedText]}
                            >
                              Arrived at destination
                            </Text>
                          </>
                        );
                      } else if (hasValidRoute) {
                        return (
                          <>
                            <Ionicons name="time" size={16} color="#FF0000" />
                            <Text style={styles.routeInfoText}>
                              {routeDistance} km • {routeDuration} min
                            </Text>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <Ionicons
                              name="location"
                              size={16}
                              color="#f59e0b"
                            />
                            <Text
                              style={[
                                styles.routeInfoText,
                                styles.destinationText,
                              ]}
                            >
                              Destination
                            </Text>
                          </>
                        );
                      }
                    })()}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

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
            style={styles.supportButton}
            onPress={() => router.push("/support&help")}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <Text style={styles.trackButtonText}>Back to Orders</Text>
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
  }, // Add these styles to your existing StyleSheet
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
