import { localizedAlert } from "@/lib/i18n/localized-alert";
import AppTextInput from "@/components/common/AppTextInput";
import AppText from "@/components/common/AppText";
import Button from "@/components/Button";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Conditionally import react-native-maps only on native platforms
let MapView: any = null;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

interface MapPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (address: {
    latitude: number;
    longitude: number;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }) => void;
}

const formatFullAddress = (addr: Location.LocationGeocodedAddress | null): string => {
  if (!addr) return "Unknown Location";

  let streetPart = addr.name || "";
  // If the street name isn't in the 'name' property, construct it
  if (addr.street && !streetPart.includes(addr.street)) {
    const constructedStreet = addr.streetNumber ? `${addr.streetNumber} ${addr.street}` : addr.street;
    streetPart = streetPart ? `${streetPart}, ${constructedStreet}` : constructedStreet;
  }

  const parts = [
    streetPart,
    addr.district,
    addr.city || addr.subregion,
    addr.region,
    addr.postalCode,
    addr.country,
  ];

  return parts.filter(Boolean).join(", ");
};

export default function MapPicker({
  visible,
  onClose,
  onSelectLocation,
}: MapPickerProps) {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [currentAddressObj, setCurrentAddressObj] = useState<Location.LocationGeocodedAddress | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      getUserLocation();
    }
  }, [visible]);

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      if (address && address.length > 0) {
        setCurrentAddressObj(address[0]);
      } else {
        setCurrentAddressObj(null);
      }
    } catch (error) {
      console.log("Geocoding error", error);
      setCurrentAddressObj(null);
    }
  };

  const getUserLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        localizedAlert("Permission Denied", "Default location will be used. You can pan to select your address manually.");
        fetchAddress(region.latitude, region.longitude);
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      fetchAddress(newRegion.latitude, newRegion.longitude);
    } catch (error) {
      console.error("Error getting location:", error);
      fetchAddress(region.latitude, region.longitude);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = () => {
    setIsMoving(true);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    setIsMoving(false);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchAddress(newRegion.latitude, newRegion.longitude);
    }, 600);
  };

  const fetchSuggestions = async (text: string) => {
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      setSearching(true);
      // Using Nominatim API for free OpenStreetMap autocomplete
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5`, {
        headers: {
          'User-Agent': 'TaskerCompanyApp/1.0'
        }
      });
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.log("Autocomplete error", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 500);
  };

  const handleSelectSuggestion = (item: any) => {
    Keyboard.dismiss();
    setSearchQuery(item.name || item.display_name.split(',')[0]);
    setSuggestions([]);
    
    const newRegion = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    fetchAddress(newRegion.latitude, newRegion.longitude);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const newRegion = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setSuggestions([]);
        fetchAddress(newRegion.latitude, newRegion.longitude);
      } else {
        localizedAlert("Not Found", "Could not find that location.");
      }
    } catch (error) {
      localizedAlert("Error", "Failed to search location. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      let streetVal = "Selected Location";
      if (currentAddressObj) {
        // Construct a highly detailed street string including name, street, and district
        let streetPart = currentAddressObj.name || "";
        if (currentAddressObj.street && !streetPart.includes(currentAddressObj.street)) {
          streetPart = currentAddressObj.streetNumber
            ? `${currentAddressObj.streetNumber} ${currentAddressObj.street}`
            : currentAddressObj.street;
        }
        const fullStreet = [streetPart, currentAddressObj.district].filter(Boolean).join(", ");
        streetVal = fullStreet || "Selected Location";
      }

      onSelectLocation({
        latitude: region.latitude,
        longitude: region.longitude,
        street: streetVal,
        city: currentAddressObj?.city || currentAddressObj?.subregion || "",
        state: currentAddressObj?.region || "",
        zip: currentAddressObj?.postalCode || "",
        country: currentAddressObj?.country || "",
      });
      setConfirming(false);
      onClose();
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 0) }]}>

        {/* Full Screen Map Container */}
        <View style={StyleSheet.absoluteFill}>
          {Platform.OS === "web" ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="map-outline" size={64} color={Colors.text.tertiary} />
              <AppText style={styles.loadingText}>Map selection is only available on mobile app</AppText>
              <Button title="Close" onPress={onClose} variant="outline" />
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.themes.customer.primary} />
              <AppText style={styles.loadingText}>Loading map...</AppText>
            </View>
          ) : (
            <View style={StyleSheet.absoluteFill}>
              <MapView
                style={StyleSheet.absoluteFill}
                initialRegion={region}
                region={region}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
                showsUserLocation
                showsMyLocationButton={false}
              />

              {/* Enhanced Fixed Center Marker */}
              <View style={styles.centerMarkerContainer} pointerEvents="none">
                <View style={[styles.pulseRing, isMoving && styles.pulseRingHidden]} />
                <View style={[styles.markerPin, isMoving && styles.markerPinMoving]}>
                  <Ionicons
                    name="location"
                    size={52}
                    color={Colors.themes.customer.primary}
                  />
                </View>
                <View style={[styles.markerShadow, isMoving && styles.markerShadowMoving]} />
              </View>
            </View>
          )}
        </View>

        {/* Floating Header & Search */}
        <View style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 16) }]} pointerEvents="box-none">
          <View style={styles.headerTop}>
            <AppText style={styles.title}>Select Location</AppText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
            <AppTextInput
              style={styles.searchInput}
              placeholder="Search city, area, or street..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color={Colors.themes.customer.primary} style={{ marginLeft: 8 }} />}
          </View>
          
          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                {suggestions.map((item, index) => (
                  <Pressable 
                    key={index} 
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.suggestionTitle} numberOfLines={1}>
                        {item.name || item.display_name.split(',')[0]}
                      </AppText>
                      <AppText style={styles.suggestionSubtitle} numberOfLines={1}>
                        {item.display_name}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Floating Footer */}
        <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, 24) }]} pointerEvents="box-none">
          <Pressable style={styles.centerButton} onPress={getUserLocation}>
            <Ionicons name="navigate" size={22} color={Colors.themes.customer.primary} />
          </Pressable>

          <View style={styles.footerCard}>
            <View style={styles.addressPreviewCard}>
              <Ionicons
                name="location-outline"
                size={24}
                color={Colors.themes.customer.primary}
              />
              <View style={{ flex: 1 }}>
                <AppText style={styles.addressPreviewTitle}>
                  {isMoving ? "Locating..." : "Selected Address"}
                </AppText>
                <AppText style={styles.addressPreviewText} numberOfLines={2}>
                  {isMoving ? "Move map to pin location" : formatFullAddress(currentAddressObj)}
                </AppText>
              </View>
            </View>

            <Button
              title="Confirm Location"
              onPress={handleConfirm}
              fullWidth
              loading={confirming}
              icon={<Ionicons name="checkmark" size={20} color={Colors.neutral.white} />}
            />
          </View>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: 24,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  suggestionsContainer: {
    backgroundColor: Colors.neutral.white,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  centerMarkerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -26,
    marginTop: -52,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.themes.customer.primary + '20',
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary + '40',
  },
  pulseRingHidden: {
    opacity: 0,
  },
  markerPin: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  markerPinMoving: {
    transform: [{ translateY: -15 }],
  },
  markerShadow: {
    width: 14,
    height: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 4,
    transform: [{ scaleX: 2 }],
  },
  markerShadowMoving: {
    transform: [{ scaleX: 1.2 }],
    opacity: 0.3,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  centerButton: {
    alignSelf: 'flex-end',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: Spacing.md,
  },
  footerCard: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.lg,
    borderRadius: 20,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    gap: Spacing.md,
  },
  addressPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: Colors.themes.customer.primary + "10",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.themes.customer.primary,
  },
  addressPreviewTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  addressPreviewText: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
});
