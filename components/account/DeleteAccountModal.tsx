import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";

interface DeleteAccountModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const DeleteAccountModal: FC<DeleteAccountModalProps> = ({
  visible,
  setVisible,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["40%"], []);

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

  const handleDeletePress = () => {
    haptics.impact("heavy");
    bottomSheetRef.current?.close();
  };

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
        }}
      >
        <View style={{ gap: 20 }}>
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              color: Colors[theme].text,
              fontSize: 22,
              textAlign: "center",
            }}
          >
            Are you sure you want to delete account?
          </Text>

          <Text
            style={{
              fontFamily: "NunitoMedium",
              color: Colors[theme].text_secondary,
              fontSize: 14,
              lineHeight: 20,
              textAlign: "center",
            }}
          >
            This clears your account and account data from Habibee's database.
            Habibee would not have any access to your data after this.
          </Text>
        </View>

        <View
          style={{
            gap: 12,
            marginTop: 30,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => {
              haptics.impact();
              bottomSheetRef.current?.close();
            }}
            style={{
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 14,
                color: Colors[theme].text,
                textAlign: "center",
              }}
            >
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDeletePress}
            style={{
              backgroundColor: "#e74c3c",
              paddingVertical: 12,
              borderRadius: 12,
              flex: 1,
            }}
          >
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 14,
                color: "#fff",
                textAlign: "center",
              }}
            >
              Delete Account
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default DeleteAccountModal;

const styles = StyleSheet.create({});
