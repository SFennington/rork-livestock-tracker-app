import { Stack } from "expo-router";
import { useTheme } from "@/hooks/theme-store";

export default function RecordsLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Records",
          headerStyle: {
            backgroundColor: colors.secondary,
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}