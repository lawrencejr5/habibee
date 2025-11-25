import { Image, StyleSheet, Text, View } from "react-native";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Account() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText style={styles.title}>Account</ThemedText>

      <View
        style={{
          backgroundColor: Colors[theme].surface,
          borderColor: Colors[theme].border,
          borderWidth: 3,
          borderRadius: 15,
          marginTop: 20,
          padding: 10,
          flexDirection: "row",
          gap: 15,
        }}
      >
        <Image
          source={require("@/assets/images/avatar.png")}
          style={{ height: 90, width: 90, borderRadius: 10 }}
        />
        <View>
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              color: Colors[theme].text,
              fontSize: 20,
            }}
          >
            Oputa Lawrence
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              alignItems: "center",
              marginTop: 5,
            }}
          >
            <Text
              style={{
                fontFamily: "NunitoMedium",
                color: Colors[theme].text_secondary,
                fontSize: 14,
              }}
            >
              @lawrencejr
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 5,
              gap: 5,
            }}
          >
            <Image
              source={require("@/assets/icons/fire.png")}
              style={{ height: 18, width: 18 }}
            />
            <Text
              style={{
                fontFamily: "NunitoBold",
                color: Colors[theme].accent1,
                fontSize: 16,
                marginTop: 5,
              }}
            >
              365
            </Text>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontFamily: "NunitoBold",
  },
});
