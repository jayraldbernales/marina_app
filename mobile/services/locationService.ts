import * as Location from "expo-location";
import { supabase } from "../lib/supabase";

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private riderId: string | null = null;
  private isTracking = false;
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 10000; // 10 seconds
  private isStarting = false; // Prevent multiple start attempts

  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  async startTracking(riderId: string) {
    // Prevent multiple simultaneous start attempts
    if (this.isStarting) {
      console.log("Already starting tracking, waiting...");
      return;
    }

    // Prevent multiple tracking instances
    if (this.isTracking && this.riderId === riderId) {
      console.log("Already tracking for this rider, skipping...");
      return;
    }

    // Stop any existing tracking first
    this.stopTracking();

    this.isStarting = true;
    console.log("Starting location tracking for rider:", riderId);

    try {
      this.riderId = riderId;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Location permission denied");
      }

      // Get initial location immediately
      await this.updateLocationOnce();

      // Start watching position
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: this.UPDATE_INTERVAL, // 10 seconds
          distanceInterval: 50, // Or every 50 meters
        },
        (location) => this.handleLocationUpdate(location),
      );

      this.isTracking = true;
      console.log("Location tracking started successfully");
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      throw error;
    } finally {
      this.isStarting = false;
    }
  }

  async updateLocationOnce() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await this.handleLocationUpdate(location);
    } catch (error) {
      console.error("Failed to get initial location:", error);
    }
  }

  private async handleLocationUpdate(location: Location.LocationObject) {
    if (!this.riderId) return;

    // Throttle updates to prevent excessive database calls
    const now = Date.now();
    if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      return;
    }

    this.lastUpdateTime = now;
    const { latitude, longitude } = location.coords;

    // Call your database function
    const { error } = await supabase.rpc("update_rider_location", {
      p_rider_id: this.riderId,
      p_lat: latitude,
      p_lng: longitude,
    });

    if (error) {
      console.error("Failed to update location:", error);
    } else {
      console.log(`Location updated: ${latitude}, ${longitude}`);
    }
  }

  stopTracking() {
    if (this.locationSubscription) {
      console.log("Stopping location tracking");
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    this.riderId = null;
    this.lastUpdateTime = 0;
    this.isStarting = false;
  }

  isTrackingActive() {
    return this.isTracking;
  }
}

export const locationService = new LocationService();
