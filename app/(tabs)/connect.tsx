import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { View as ThemedView } from "@/components/Themed";

import SearchFriendsModal from "@/components/SearchFriendsModal";
import Colors from "@/constants/Colors";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";

// Dummy data for friends
const myFriends = [
  {
    id: "1",
    name: "Sarah",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    streak: 45,
  },
  {
    id: "2",
    name: "Mike",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    streak: 32,
  },
  {
    id: "3",
    name: "Emma",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    streak: 78,
  },
  {
    id: "4",
    name: "John",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    streak: 12,
  },
  {
    id: "5",
    name: "Lisa",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    streak: 156,
  },
];

const suggestedFriends = [
  {
    id: "6",
    name: "David Chen",
    username: "@davidc",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    mutualFriends: 3,
  },
  {
    id: "7",
    name: "Anna Smith",
    username: "@annasmith",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    mutualFriends: 5,
  },
  {
    id: "8",
    name: "Marcus Lee",
    username: "@marcuslee",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    mutualFriends: 2,
  },
  {
    id: "9",
    name: "Sofia Rodriguez",
    username: "@sofia_r",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    mutualFriends: 7,
  },
  {
    id: "10",
    name: "James Wilson",
    username: "@jwilson",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    mutualFriends: 1,
  },
  {
    id: "11",
    name: "Olivia Brown",
    username: "@oliviab",
    avatar: require("@/assets/images/avatars/avatar7.png"),
    mutualFriends: 4,
  },
];

export default function ConnectPage() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const haptics = useHapitcs();

  const [addedFriends, setAddedFriends] = useState<string[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const handleAddFriend = (friendId: string) => {
    haptics.impact();
    setAddedFriends([...addedFriends, friendId]);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={[styles.title, { color: Colors[theme].text }]}>
          Connect
        </Text>
        <Text
          style={{
            fontFamily: "NunitoRegular",
            fontSize: 14,
            color: Colors[theme].text_secondary,
            marginTop: 5,
          }}
        >
          Stay motivated with friends
        </Text>
      </View>

      {/* Search Bar */}
      <Pressable
        onPress={() => {
          haptics.impact("light");
          setSearchModalVisible(true);
        }}
        style={{ paddingHorizontal: 20, marginBottom: 20 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors[theme].surface,
            borderRadius: 12,
            paddingHorizontal: 15,
            paddingVertical: 12,
            borderWidth: 2,
            borderColor: Colors[theme].border,
          }}
        >
          <Image
            source={require("../../assets/icons/search.png")}
            style={{
              width: 18,
              height: 18,
              tintColor: Colors[theme].text_secondary,
              marginRight: 10,
            }}
          />
          <Text
            style={{
              flex: 1,
              fontFamily: "NunitoRegular",
              fontSize: 14,
              color: Colors[theme].text_secondary,
            }}
          >
            Search friends...
          </Text>
        </View>
      </Pressable>

      {/* Main ScrollView */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View
          style={{
            backgroundColor: Colors[theme].surface,
            borderColor: Colors[theme].border,
            borderWidth: 3,
            borderRadius: 20,
            height: 400,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={
              theme === "light"
                ? require("../../assets/images/icon-nobg-black.png")
                : require("../../assets/images/icon-nobg-white.png")
            }
            style={{ width: 100, height: 100, borderRadius: 20 }}
          />

          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 25,
              color: Colors[theme].text,
              marginTop: 20,
            }}
          >
            Coming Soon!
          </Text>
          <Text
            style={{
              fontFamily: "NunitoMedium",
              fontSize: 14,
              color: Colors[theme].text_secondary,
              textAlign: "center",
            }}
          >
            You’ll soon be able to add friends, share streaks, and motivate each
            other.
          </Text>
        </View>
      </ScrollView>
      <SearchFriendsModal
        visible={searchModalVisible}
        setVisible={setSearchModalVisible}
      />
    </ThemedView>
  );
}

const FriendStoryCircle: React.FC<{
  name: string;
  avatar: any;
  streak: number;
}> = ({ name, avatar, streak }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

  return (
    <Pressable
      onPress={() => {
        haptics.impact("light");
      }}
      style={{ alignItems: "center", width: 75 }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          padding: 3,
          marginBottom: 5,
        }}
      >
        <Image
          source={avatar}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 32,
            borderWidth: 2,
            borderColor: Colors[theme].accent2,
          }}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: "NunitoBold",
          fontSize: 12,
          color: Colors[theme].text,
          textAlign: "center",
        }}
      >
        {name}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          marginTop: 3,
        }}
      >
        <Image
          source={require("../../assets/icons/fire.png")}
          style={{ width: 12, height: 12 }}
        />
        <Text
          style={{
            fontFamily: "NunitoBold",
            fontSize: 11,
            color: Colors[theme].accent1,
          }}
        >
          {streak}
        </Text>
      </View>
    </Pressable>
  );
};

const SuggestedFriendCard: React.FC<{
  id: string;
  name: string;
  username: string;
  avatar: any;
  mutualFriends: number;
  isAdded: boolean;
  onAdd: () => void;
}> = ({ name, username, avatar, mutualFriends, isAdded, onAdd }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors[theme].surface,
        padding: 15,
        borderRadius: 15,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: Colors[theme].border,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
      >
        <Image
          source={avatar}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "NunitoBold",
              fontSize: 16,
              color: Colors[theme].text,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: "NunitoRegular",
              fontSize: 13,
              color: Colors[theme].text_secondary,
              marginTop: 2,
            }}
          >
            {username}
          </Text>
          {/* <Text
            style={{
              fontFamily: "NunitoRegular",
              fontSize: 12,
              color: Colors[theme].text_secondary,
              marginTop: 3,
            }}
          >
            {mutualFriends} mutual friends
          </Text> */}
        </View>
      </View>
      <Pressable
        onPress={onAdd}
        disabled={isAdded}
        style={{
          backgroundColor: isAdded
            ? Colors[theme].surface
            : Colors[theme].primary,
          paddingVertical: 8,
          paddingHorizontal: 20,
          borderRadius: 20,
          borderWidth: isAdded ? 2 : 0,
          borderColor: Colors[theme].border,
        }}
      >
        <Text
          style={{
            fontFamily: "NunitoBold",
            fontSize: 13,
            color: isAdded ? Colors[theme].text_secondary : "#fff",
          }}
        >
          {isAdded ? "Added" : "Add"}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: "NunitoExtraBold",
  },
});
