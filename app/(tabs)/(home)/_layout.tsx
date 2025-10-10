import { Stack } from "expo-router";
import { useTheme } from "@/hooks/theme-store";

export default function HomeLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Dashboard",
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}