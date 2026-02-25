// components/CustomTabIcon.tsx
import React from "react";
import { View, Text } from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";

// Define specific types for each icon library
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];
type CommunityIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];
type IoniconsIconName = React.ComponentProps<typeof Ionicons>["name"];

interface CustomTabIconProps {
  focused: boolean;
  size?: number;
  color: string;
  iconName: string; // We'll keep this as string for flexibility
  iconLibrary: "material" | "community" | "ionicons";
  badgeCount?: number;
}

// Helper function to get the correct icon name with/without outline
const getIconName = (
  library: string,
  baseName: string,
  focused: boolean,
): any => {
  switch (library) {
    case "community":
      return focused ? baseName : (`${baseName}-outline` as any);
    case "ionicons":
      return focused ? baseName : (`${baseName}-outline` as any);
    case "material":
    default:
      return focused ? baseName : (`${baseName}-none` as any);
  }
};

const CustomTabIcon: React.FC<CustomTabIconProps> = ({
  focused,
  size = 28,
  color,
  iconName,
  iconLibrary,
  badgeCount = 0,
}) => {
  const renderIcon = () => {
    const iconSize = size ?? 28;
    const name = getIconName(iconLibrary, iconName, focused);

    switch (iconLibrary) {
      case "community":
        return (
          <MaterialCommunityIcons name={name} size={iconSize} color={color} />
        );
      case "ionicons":
        return <Ionicons name={name} size={iconSize} color={color} />;
      case "material":
      default:
        return <MaterialIcons name={name} size={iconSize} color={color} />;
    }
  };

  return (
    <View
      style={{
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {renderIcon()}
      {badgeCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -6,
            backgroundColor: "red",
            borderRadius: 10,
            minWidth: 16,
            height: 16,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export default CustomTabIcon;
