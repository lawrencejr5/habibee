import React, {
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { PlanContent } from "./PlanContent";

interface PlanModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const PlanModal: FC<PlanModalProps> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      stackBehavior="push"
      onDismiss={() => setVisible(false)}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 4,
        backgroundColor: Colors[theme].border,
        marginTop: 10,
        opacity: 0.5,
      }}
    >
      <BottomSheetView style={[styles.sheetContainer, { flex: 1, height: "100%", paddingBottom: insets.bottom + 20 }]}>
        <PlanContent />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
  },
});

export default PlanModal;
