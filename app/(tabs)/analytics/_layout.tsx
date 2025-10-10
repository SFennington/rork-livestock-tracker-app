import { Stack } from "expo-router";
import { useTheme } from "@/hooks/theme-store";

export default function AnalyticsLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Analytics",
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}