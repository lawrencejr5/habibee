import { Image, StyleSheet } from "react-native";

import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";

import Colors from "@/constants/Colors";
import { useColorScheme } from "react-native";

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  return (
    <ThemedView
      style={[styles.container, { paddingVertical: insets.top + 20 }]}
    >
      <View style={styles.user_container}>
        <Image
          source={require("../../assets/images/avatar.png")}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
        <View>
          <ThemedText style={styles.greeting_user}>
            Morning, Lawrencejr
          </ThemedText>
          <Text
            style={[
              styles.date_time,
              { color: Colors[theme ?? "light"].text_grey },
            ]}
          >
            Thur, 10 March 2025
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.streak_card,
          { backgroundColor: Colors[theme ?? "light"].light_background },
        ]}
      >
        <View
          style={{
            backgroundColor: "transparent",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            source={require("../../assets/icons/streak.png")}
            style={{
              tintColor: Colors[theme ?? "light"].primary,
              width: 50,
              height: 50,
            }}
          />
          <View style={{ backgroundColor: "transparent" }}>
            <ThemedText style={{ fontFamily: "FredokaSemiBold", fontSize: 25 }}>
              365
            </ThemedText>
            <ThemedText style={{ fontFamily: "FredokaLight", fontSize: 14 }}>
              day streak
            </ThemedText>
          </View>
        </View>

        <View
          style={{
            marginTop: 30,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <StreakDay day="S" done={true} />
          <StreakDay day="M" done={true} />
          <StreakDay day="T" done={true} />
          <StreakDay day="W" done={true} />
          <StreakDay day="T" done={false} />
          <StreakDay day="F" done={false} />
          <StreakDay day="S" done={false} />
        </View>
      </View>
    </ThemedView>
  );
}

const StreakDay: React.FC<{ day: string; done: boolean }> = ({ day, done }) => {
  const theme = useColorScheme();
  return (
    <View
      style={{
        alignItems: "center",
      }}
    >
      <Image
        source={
          done
            ? require("../../assets/icons/check-fill.png")
            : require("../../assets/icons/check-outline.png")
        }
        style={{ tintColor: "#e56d2b", width: 22, height: 22 }}
      />
      <Text
        style={{
          color: Colors[theme ?? "light"].text_grey,
          marginTop: 10,
        }}
      >
        {day}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  user_container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greeting_user: {
    fontSize: 18,
    fontFamily: "FredokaMedium",
  },
  date_time: {
    fontFamily: "FredokaRegular",
    fontSize: 12,
    marginTop: 5,
  },

  streak_card: {
    width: "100%",
    marginTop: 30,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});
