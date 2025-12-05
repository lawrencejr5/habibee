import { StyleSheet, Text, View } from "react-native";
import React, {
  Children,
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
} from "react";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useLoadingContext } from "./LoadingContext";

interface UserContextType {
  signedIn: string;
}

const UserContext = createContext<UserContextType | null>(null);

const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { appLoading } = useLoadingContext();

  const currentUser = useQuery(api.users.get_current_user);
  const signedIn = currentUser?._id as string;

  return (
    <UserContext.Provider value={{ signedIn }}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("User context must be within the user provider");
  return context;
};

export default UserProvider;
