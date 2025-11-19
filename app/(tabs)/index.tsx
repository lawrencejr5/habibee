import { Image, Pressable, StyleSheet } from "react-native";

import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text as ThemedText } from "@/components/Themed";

import Colors from "@/constants/Colors";
import { useColorScheme } from "react-native";

import AddButton from "@/components/AddButton";
import { habitIcons, habitsData } from "@/data/habits";

import AddModal from "@/components/home/AddModal";
import * as Haptics from "expo-haptics";
import { useState } from "react";

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();

  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);

  const open = () => {
    setAddModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* User - Fixed Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 10,
          backgroundColor: Colors[theme ?? "light"].background,
          zIndex: 2,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={styles.user_container}>
          <Image
            source={
              theme === "light"
                ? require("../../assets/images/icon-nobg-black.png")
                : require("../../assets/images/icon-nobg-white.png")
            }
            style={{ width: 60, height: 60, borderRadius: 20 }}
          />
          <View>
            <ThemedText style={styles.greeting_user}>
              Morning, Lawrencejr
            </ThemedText>
            <Text
              style={[
                styles.date_time,
                { color: Colors[theme ?? "light"].text_secondary },
              ]}
            >
              Thur, 10 March 2025
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginTop: 10,
          }}
        >
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 16,
              color: Colors[theme ?? "light"].accent1,
            }}
          >
            365
          </Text>
          <Image
            source={require("../../assets/icons/fire.png")}
            style={{
              width: 20,
              height: 20,
            }}
          />
        </View>
      </View>

      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: Colors[theme ?? "light"].background,
          },
        ]}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Card */}
        <View style={[styles.streak_card]}>
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <StreakDay day="Sun" done={true} />
            <StreakDay day="Mon" done={true} />
            <StreakDay day="Tue" done={true} />
            <StreakDay day="Wed" done={false} />
            <StreakDay day="Thu" done={false} />
            <StreakDay day="Fri" done={false} />
            <StreakDay day="Sat" done={false} />
          </View>
        </View>

        {/* Tasks */}
        <View style={{ marginTop: 40 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ThemedText style={{ fontFamily: "NunitoExtraBold", fontSize: 20 }}>
              Daily Habibees
            </ThemedText>
            <Pressable
              style={{
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 7,
              }}
            >
              <ThemedText
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 14,
                  color: Colors[theme ?? "light"].text_secondary,
                }}
              >
                See all
              </ThemedText>
            </Pressable>
          </View>
          <View>
            {habitsData.map((habit) => (
              <HabitCard
                key={habit.id}
                duration={habit.duration}
                title={habit.title}
                done={habit.done}
                streak={habit.streak}
                habitType={habit.habitType}
                themeColor={habit.themeColor}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <AddButton onPress={open} />
      <AddModal visible={addModalVisible} setVisible={setAddModalVisible} />
    </View>
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
      <ThemedText
        style={{
          color: Colors[theme ?? "light"].text_secondary,
          fontFamily: "NunitoBold",
        }}
      >
        {day}
      </ThemedText>
      <Image
        source={
          done
            ? require("../../assets/icons/check-fill.png")
            : require("../../assets/icons/check-outline.png")
        }
        style={{
          tintColor: Colors[theme ?? "light"].primary,
          width: 25,
          marginTop: 15,
          height: 25,
        }}
      />
    </View>
  );
};

const HabitCard: React.FC<{
  duration: string;
  title: string;
  done: boolean;
  streak: number;
  habitType: string;
  themeColor: string;
}> = ({ duration, title, done, streak, habitType, themeColor }) => {
  const theme = useColorScheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        backgroundColor: Colors[theme ?? "light"].surface,
        padding: 15,
        marginTop: 15,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: Colors[theme ?? "light"].border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 15,
          marginLeft: 5,
        }}
      >
        <Image
          source={habitIcons[habitType]}
          style={{
            width: 20,
            height: 20,
            tintColor: themeColor,
          }}
        />

        <View>
          <ThemedText
            numberOfLines={1}
            style={{ fontFamily: "NunitoBold", fontSize: 16, width: 200 }}
          >
            {title}
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                width: 80,
              }}
            >
              <Image
                source={require("../../assets/icons/clock.png")}
                style={{
                  tintColor: Colors[theme ?? "light"].text_secondary,
                  width: 14,
                  height: 14,
                }}
              />
              <ThemedText
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 12,
                  color: Colors[theme ?? "light"].text_secondary,
                }}
              >
                {duration}
              </ThemedText>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Image
                source={require("../../assets/icons/fire.png")}
                style={{
                  tintColor: !done
                    ? Colors[theme ?? "light"].text_secondary
                    : "",
                  width: 14,
                  height: 14,
                }}
              />
              <ThemedText
                style={{
                  color: done
                    ? Colors[theme ?? "light"].accent1
                    : Colors[theme ?? "light"].text_secondary,
                  fontFamily: "NunitoBold",
                }}
              >
                {streak}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
      <View
        style={{
          borderLeftWidth: 3,
          borderColor: Colors[theme ?? "light"].border,
          width: 50,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Image
          source={require("../../assets/icons/fire.png")}
          style={{
            tintColor: !done ? Colors[theme ?? "light"].text_secondary : "",
            width: 30,
            height: 30,
          }}
        />
      </View>
    </Pressable>
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
  },
  greeting_user: {
    fontSize: 16,
    fontFamily: "NunitoExtraBold",
  },
  date_time: {
    fontFamily: "NunitoRegular",
    fontSize: 12,
    marginTop: 5,
  },

  streak_card: {
    width: "100%",
    borderRadius: 20,
    paddingHorizontal: 10,
  },
});
