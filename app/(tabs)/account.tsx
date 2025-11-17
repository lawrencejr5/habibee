import { Text, View } from "@/components/Themed";
import React from "react";
import { StyleSheet } from "react-native";

const Account = () => {
  return (
    <View style={styles.container}>
      <Text>Account</Text>
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
