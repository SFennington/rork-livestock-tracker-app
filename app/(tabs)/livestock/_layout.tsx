import { Stack } from "expo-router";
import { useTheme } from "@/hooks/theme-store";

export default function LivestockLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Livestock",
          headerStyle: {
            backgroundColor: colors.accent,
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}