import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
} from "react";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Colors from "@/constants/Colors";
import { useColorScheme } from "../useColorScheme";
import { Feather } from "@expo/vector-icons";

import * as Haptics from "expo-haptics";
import { router } from "expo-router";

interface AccountModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const AccountInfoModal: FC<AccountModalProps> = ({ visible, setVisible }) => {
  const theme = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["20%"], []);

  useEffect(() => {
    if (visible) bottomSheetRef.current?.expand();
    else bottomSheetRef.current?.close();
  }, [visible]);

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      onClose={() => setVisible(false)}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 5,
        backgroundColor: "grey",
        marginTop: 10,
        borderRadius: 30,
      }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          backgroundColor: Colors[theme].background,
          paddingVertical: 20,
          paddingHorizontal: 20,
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <View
          style={{
            alignItems: "center",
            flex: 1,
          }}
        >
          <Image
            source={require("@/assets/images/avatar.png")}
            style={{ width: 120, height: 120, borderRadius: 75 }}
          />
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              color: Colors[theme].text,
              fontSize: 25,
              marginTop: 20,
            }}
          >
            Oputa Lawrence
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Feather
                name="user"
                size={16}
                color={Colors[theme].text_secondary}
              />

              <Text
                style={{
                  fontFamily: "NunitoMedium",
                  color: Colors[theme].text_secondary,
                  fontSize: 14,
                }}
              >
                lawrencejr
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Image
                source={require("@/assets/icons/fire.png")}
                style={{ height: 16, width: 16 }}
              />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  color: Colors[theme].accent1,
                  fontSize: 14,
                }}
              >
                365
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={{
            width: "100%",
            backgroundColor: Colors[theme].primary,
            paddingVertical: 10,
            borderRadius: 50,
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/account/personal_info");
            setVisible(false);
          }}
        >
          <Text
            style={{
              fontFamily: "NunitoBold",
              fontSize: 16,
              color: "#eee",
              textAlign: "center",
            }}
          >
            Edit Details
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default AccountInfoModal;
