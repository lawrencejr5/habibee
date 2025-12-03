import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { useLoadingContext } from "@/context/LoadingContext";

export interface MotivationType {
  _id: string;
  text: string;
  visible: boolean;
}

interface MotivationMsgContextType {
  motivationalMsgs: MotivationType[] | null;
}

const MotivationMsgContext = createContext<MotivationMsgContextType | null>(
  null
);

const MotivationMsgProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { setAppLoading } = useLoadingContext();

  const [motivationalMsgs, setMotivationalMsgs] = useState<
    MotivationType[] | null
  >(null);

  useEffect(() => {
    const msgs = useQuery(api.motivationa_messages.get);
    if (msgs === undefined) {
      setAppLoading(true);
    } else {
      setMotivationalMsgs(msgs);
    }
  }, []);

  return (
    <MotivationMsgContext.Provider value={{ motivationalMsgs }}>
      {children}
    </MotivationMsgContext.Provider>
  );
};

export const useMotivationalContext = () => {
  const context = useContext(MotivationMsgContext);
  if (!context)
    throw new Error(
      "Loading context must be used within loading context provider"
    );
  return context;
};

export default MotivationMsgProvider;
