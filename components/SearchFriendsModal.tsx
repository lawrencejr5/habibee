import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Entypo } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Dummy data
const myFriends = [
  {
    id: "1",
    name: "Sarah",
    username: "@sarah_h",
    avatar: require("../assets/images/avatars/avatar7.png"),
    streak: 45,
    isFriend: true,
  },
  {
    id: "2",
    name: "Mike",
    username: "@mike_p",
    avatar: require("../assets/images/avatars/avatar7.png"),
    streak: 32,
    isFriend: true,
  },
  {
    id: "3",
    name: "Emma",
    username: "@emma_w",
    avatar: require("../assets/images/avatars/avatar7.png"),
    streak: 78,
    isFriend: true,
  },
  {
    id: "4",
    name: "John",
    username: "@john_d",
    avatar: require("../assets/images/avatars/avatar7.png"),
    streak: 12,
    isFriend: true,
  },
  {
    id: "5",
    name: "Lisa",
    username: "@lisa_m",
    avatar: require("../assets/images/avatars/avatar7.png"),
    streak: 156,
    isFriend: true,
  },
];

const suggestedFriends = [
  {
    id: "6",
    name: "David Chen",
    username: "@davidc",
    avatar: require("../assets/images/avatars/avatar7.png"),
    mutualFriends: 3,
    isFriend: false,
  },
  {
    id: "7",
    name: "Anna Smith",
    username: "@annasmith",
    avatar: require("../assets/images/avatars/avatar7.png"),
    mutualFriends: 5,
    isFriend: false,
  },
  {
    id: "8",
    name: "Marcus Lee",
    username: "@marcuslee",
    avatar: require("../assets/images/avatars/avatar7.png"),
    mutualFriends: 2,
    isFriend: false,
  },
  {
    id: "9",
    name: "Sofia Rodriguez",
    username: "@sofia_r",
    avatar: require("../assets/images/avatars/avatar7.png"),
    mutualFriends: 7,
    isFriend: false,
  },
  {
    id: "10",
    name: "James Wilson",
    username: "@jwilson",
    avatar: require("../assets/images/avatars/avatar7.png"),
    mutualFriends: 1,
    isFriend: false,
  },
  {
    id: "11",
    name: "Olivia Brown",
    username: "@oliviab",
    avatar: require("../assets/images/avatars/avatar7.png"),
    mutualFriends: 4,
    isFriend: false,
  },
];

const allPeople = [...myFriends, ...suggestedFriends];

interface SearchFriendsModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const SearchFriendsModal: React.FC<SearchFriendsModalProps> = ({
  visible,
  setVisible,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedFriends, setAddedFriends] = useState<string[]>([]);

  const snapPoints = useMemo(() => ["100%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleAddFriend = (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAddedFriends([...addedFriends, friendId]);
  };

  const filteredPeople = allPeople.filter(
    (person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = searchQuery.trim().length > 0;

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={() => setVisible(false)}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
      }}
      handleIndicatorStyle={{
        width: 0,
        height: 0,
        backgroundColor: "transaparent",
        marginTop: 10,
        borderRadius: 20,
      }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          paddingTop: 20,
        }}
      >
        {/* Header with Close Button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            marginBottom: 20,
            gap: 15,
          }}
        >
          {/* Search Bar */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors[theme].surface,
              borderRadius: 12,
              paddingHorizontal: 15,
              paddingVertical: 0,
              borderWidth: 2,
              borderColor: Colors[theme].border,
            }}
          >
            <Image
              source={require("../assets/icons/search.png")}
              style={{
                width: 18,
                height: 18,
                tintColor: Colors[theme].text_secondary,
                marginRight: 10,
              }}
            />
            <TextInput
              placeholder="Search friends..."
              placeholderTextColor={Colors[theme].text_secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontFamily: "NunitoRegular",
                fontSize: 14,
                color: Colors[theme].text,
              }}
            />
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setVisible(false);
            }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
              borderColor: Colors[theme].border,
            }}
          >
            <Entypo
              name="chevron-thin-down"
              color={Colors[theme].text}
              size={24}
            />
          </Pressable>
        </View>

        {/* Results */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {!hasResults ? (
            <View style={{ alignItems: "center", marginTop: 100 }}>
              <Image
                source={require("../assets/icons/search.png")}
                style={{
                  width: 60,
                  height: 60,
                  tintColor: Colors[theme].text_secondary,
                  opacity: 0.3,
                  marginBottom: 20,
                }}
              />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 18,
                  color: Colors[theme].text_secondary,
                }}
              >
                Search for friends
              </Text>
              <Text
                style={{
                  fontFamily: "NunitoRegular",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                Find friends by name or username
              </Text>
            </View>
          ) : filteredPeople.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 100 }}>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 18,
                  color: Colors[theme].text_secondary,
                }}
              >
                No results found
              </Text>
              <Text
                style={{
                  fontFamily: "NunitoRegular",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                  marginTop: 10,
                }}
              >
                Try a different search term
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                  marginBottom: 15,
                }}
              >
                {filteredPeople.length} result
                {filteredPeople.length !== 1 ? "s" : ""}
              </Text>
              {filteredPeople.map((person) => (
                <PersonCard
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  username={person.username}
                  avatar={person.avatar}
                  isFriend={person.isFriend}
                  streak={person.isFriend ? (person as any).streak : undefined}
                  mutualFriends={
                    !person.isFriend ? (person as any).mutualFriends : undefined
                  }
                  isAdded={addedFriends.includes(person.id)}
                  onAdd={() => handleAddFriend(person.id)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const PersonCard: React.FC<{
  id: string;
  name: string;
  username: string;
  avatar: any;
  isFriend: boolean;
  streak?: number;
  mutualFriends?: number;
  isAdded: boolean;
  onAdd: () => void;
}> = ({
  name,
  username,
  avatar,
  isFriend,
  streak,
  mutualFriends,
  isAdded,
  onAdd,
}) => {
  const theme = useColorScheme();

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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
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
            {isFriend && (
              <View
                style={{
                  backgroundColor: Colors[theme].primary + "20",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 10,
                    color: Colors[theme].primary,
                  }}
                >
                  Friend
                </Text>
              </View>
            )}
          </View>
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
          {isFriend && streak !== undefined && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginTop: 5,
              }}
            >
              <Image
                source={require("../assets/icons/fire.png")}
                style={{ width: 12, height: 12 }}
              />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 12,
                  color: Colors[theme].accent1,
                }}
              >
                {streak} day streak
              </Text>
            </View>
          )}
          {!isFriend && mutualFriends !== undefined && (
            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 12,
                color: Colors[theme].text_secondary,
                marginTop: 3,
              }}
            >
              {mutualFriends} mutual friends
            </Text>
          )}
        </View>
      </View>
      {!isFriend && (
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
      )}
    </View>
  );
};

export default SearchFriendsModal;
