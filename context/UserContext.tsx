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
import { FunctionReturnType } from "convex/server";
import { Doc } from "@/convex/_generated/dataModel";

type UserData = Doc<"users">;
interface UserContextType {
  signedIn: string;
  currentUser: UserData | undefined;
}

const UserContext = createContext<UserContextType | null>(null);

const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { setAppLoading } = useLoadingContext();

  const currentUser = useQuery(api.users.get_current_user);
  const signedIn = currentUser?._id as string;

  return (
    <UserContext.Provider
      value={{ signedIn, currentUser: currentUser as UserData }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("User context must be within the user provider");
  return context;
};

export default UserProvider;
