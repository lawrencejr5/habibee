import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Account() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingHorizontal: 20 },
      ]}
    >
      <Text style={styles.title}>Account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: "NunitoBold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
