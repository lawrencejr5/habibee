import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Colors from "@/constants/Colors";
import { AntDesign, Feather } from "@expo/vector-icons";

import { router } from "expo-router";
import { useHapitcs } from "@/context/HapticsContext";

import { useAuthActions } from "@convex-dev/auth/react";
import { ActivityIndicator } from "react-native";
import { useUser } from "@/context/UserContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";

import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AccountModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const AccountInfoModal: FC<AccountModalProps> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

  const { showCustomAlert } = useCustomAlert();

  const { signedIn } = useUser();
  const today = new Date().toLocaleDateString("en-CA");

  const { signOut } = useAuthActions();
  const [signingOut, setSigninOut] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);

  const generateUploadUrl = useMutation(api.users.report_image_upload_url);
  const updateProfileImage = useMutation(api.users.update_profile_image);

  const handleSignout = async () => {
    setSigninOut(true);
    try {
      haptics.impact();
      await signOut();
      showCustomAlert("Signed out", "success");
    } catch (err) {
      console.log(err);
      showCustomAlert("An error occured!", "danger");
    } finally {
      setSigninOut(false);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // 3. POST to Convex
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await result.json();

      // 4. Update user profile
      await updateProfileImage({ storageId });
      showCustomAlert("Profile picture updated!", "success");
    } catch (error) {
      console.error(error);
      showCustomAlert("Failed to upload image", "danger");
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log(err);
      showCustomAlert("Failed to pick image", "danger");
    }
  };

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%"], []);

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
          <View style={{ position: "relative" }}>
            <Image
              source={
                signedIn?.profile_url
                  ? { uri: signedIn.profile_url }
                  : require("@/assets/images/avatar.png")
              }
              style={{ width: 120, height: 120, borderRadius: 75 }}
            />
            <Pressable
              onPress={pickImage}
              disabled={uploading}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: Colors[theme].primary,
                padding: 8,
                borderRadius: 20,
                borderWidth: 3,
                borderColor: Colors[theme].background,
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="edit-2" size={16} color="#fff" />
              )}
            </Pressable>
          </View>

          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              color: Colors[theme].text,
              fontSize: 25,
              marginTop: 20,
              textTransform: "capitalize",
            }}
          >
            {signedIn?.fullname}
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
                  textTransform: "lowercase",
                }}
              >
                {signedIn?.username}
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
                style={{
                  height: 16,
                  width: 16,
                  tintColor:
                    signedIn?.last_streak_date === today
                      ? undefined
                      : Colors[theme].text_secondary,
                }}
              />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  color:
                    signedIn?.last_streak_date === today
                      ? Colors[theme].accent1
                      : Colors[theme].text_secondary,
                  fontSize: 14,
                }}
              >
                {signedIn?.streak ?? 0}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: Colors[theme].primary,
              paddingVertical: 10,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
            onPress={() => {
              haptics.impact();
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
            <Feather name="edit" size={16} color={"#eee"} />
          </Pressable>
          <Pressable
            disabled={signingOut}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 50,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: signingOut ? 0.5 : 1,
            }}
            onPress={handleSignout}
          >
            {signingOut ? (
              <ActivityIndicator color={Colors[theme].text_secondary} />
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 14,
                    color: Colors[theme].text_secondary,
                    textAlign: "center",
                  }}
                >
                  Logout
                </Text>
                <AntDesign
                  name="poweroff"
                  size={14}
                  color={Colors[theme].text_secondary}
                />
              </>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default AccountInfoModal;
