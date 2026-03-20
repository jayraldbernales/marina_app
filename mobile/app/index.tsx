import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { View, ActivityIndicator } from "react-native";
import { useState } from "react";

export default function Welcome() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenWelcome").then((val) => {
      if (val === "true") {
        router.replace("/login"); // already seen, skip immediately
      } else {
        setShow(true); // first time, show welcome
      }
      setChecked(true);
    });
  }, []);

  if (!checked || !show) {
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  return <WelcomeScreen />;
}
