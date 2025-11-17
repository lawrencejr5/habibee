import { StyleSheet } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingVertical: insets.top + 20 }]}>
      <Text style={styles.title}>Hello Oputa 👋</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    fontFamily: "FredokaMedium",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
