import * as Location from "expo-location";
import { supabase } from "../lib/supabase";

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private riderId: string | null = null;
  private isTracking = false;

  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  async startTracking(riderId: string) {
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
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 50, // Or every 50 meters
      },
      (location) => this.handleLocationUpdate(location),
    );

    this.isTracking = true;
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
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    this.riderId = null;
  }

  isTrackingActive() {
    return this.isTracking;
  }
}

export const locationService = new LocationService();
