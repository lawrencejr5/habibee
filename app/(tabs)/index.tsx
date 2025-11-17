import { Image, StyleSheet } from "react-native";

import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text as ThemedText } from "@/components/Themed";

import Colors from "@/constants/Colors";
import { useColorScheme } from "react-native";

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: Colors[theme ?? "light"].background,
        },
      ]}
      contentContainerStyle={{
        paddingVertical: insets.top + 20,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* User */}
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

      {/* Streak Card */}
      <View
        style={[
          styles.streak_card,
          { backgroundColor: Colors[theme ?? "light"].light_background },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            source={require("../../assets/icons/fire.png")}
            style={{
              width: 50,
              height: 50,
            }}
          />
          <View style={{ backgroundColor: "transparent" }}>
            <ThemedText
              style={{ fontFamily: "ManropeExtraBold", fontSize: 25 }}
            >
              365
            </ThemedText>
            <ThemedText style={{ fontFamily: "ManropeLight", fontSize: 14 }}>
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

      {/* Tasks */}
      <View style={{ marginTop: 40 }}>
        <ThemedText style={{ fontFamily: "ManropeExtraBold", fontSize: 20 }}>
          Current Habibees...
        </ThemedText>
        <View>
          <HabitCard duration="32 mins" title="Praying everyday" done={true} />
          <HabitCard duration="2 hrs" title="Gyming" done={false} />
          <HabitCard
            duration="10 mins"
            title="Read 10 chapters of a book"
            done={true}
          />
          <HabitCard duration="1 hr" title="Code for an hour" done={true} />
        </View>
      </View>
    </ScrollView>
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

const HabitCard: React.FC<{
  duration: string;
  title: string;
  done: boolean;
}> = ({ duration, title, done }) => {
  const theme = useColorScheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        backgroundColor: Colors[theme ?? "light"].light_background,
        padding: 15,
        marginTop: 15,
        borderRadius: 12,
      }}
    >
      <View>
        <ThemedText style={{ fontFamily: "ManropeExtraBold" }}>
          {title}
        </ThemedText>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 10,
            gap: 7,
          }}
        >
          <Image
            source={require("../../assets/icons/clock.png")}
            style={{
              tintColor: Colors[theme ?? "light"].text_grey,
              width: 14,
              height: 14,
            }}
          />
          <ThemedText
            style={{
              fontFamily: "ManropeLight",
              fontSize: 12,
              color: Colors[theme ?? "light"].text_grey,
            }}
          >
            {duration}
          </ThemedText>
        </View>
      </View>
      <View>
        <Image
          source={require("../../assets/icons/fire.png")}
          style={{
            tintColor: !done ? Colors[theme ?? "light"].text_grey : "",
            width: 30,
            height: 30,
          }}
        />
      </View>
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
    fontFamily: "ManropeExtraBold",
  },
  date_time: {
    fontFamily: "ManropeRegular",
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
