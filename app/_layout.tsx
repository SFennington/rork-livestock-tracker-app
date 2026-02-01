import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LivestockProvider } from "@/hooks/livestock-store";
import { ThemeProvider, useTheme } from "@/hooks/theme-store";
import { BackupProvider } from "@/hooks/backup-store";
import { AppSettingsProvider } from "@/hooks/app-settings-store";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from 'expo-system-ui';

SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('SplashScreen.preventAutoHideAsync failed');
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  const { colors } = useTheme();
  
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);
  
  return (
    <>
      <StatusBar style="light" />
      <Stack 
        screenOptions={{ 
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            color: '#ffffff',
          },
        }}
      >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-chicken" options={{ presentation: "modal", title: "Add Chicken", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="edit-chicken/[id]" options={{ presentation: "modal", title: "Edit Chicken", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="add-duck" options={{ presentation: "modal", title: "Add Duck", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="edit-duck/[id]" options={{ presentation: "modal", title: "Edit Duck", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="add-rabbit" options={{ presentation: "modal", title: "Add Rabbit", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="edit-rabbit/[id]" options={{ presentation: "modal", title: "Edit Rabbit", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="add-chicken-event" options={{ presentation: "modal", title: "Log Chicken Event", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="add-duck-event" options={{ presentation: "modal", title: "Log Duck Event", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="edit-chicken-event/[id]" options={{ presentation: "modal", title: "Edit Event", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="edit-duck-event/[id]" options={{ presentation: "modal", title: "Edit Event", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="add-expense" options={{ presentation: "modal", title: "Add Expense", headerStyle: { backgroundColor: '#ef4444' } }} />
      <Stack.Screen name="add-income" options={{ presentation: "modal", title: "Add Income", headerStyle: { backgroundColor: '#10b981' } }} />
      <Stack.Screen name="add-transaction" options={{ presentation: "modal", title: "Add Transaction" }} />
      <Stack.Screen name="log-eggs" options={{ presentation: "modal", title: "Log Egg Production", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="add-breeding" options={{ presentation: "modal", title: "Record Breeding", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="breeding-calendar" options={{ title: "Breeding Calendar", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="rabbit-health" options={{ title: "Rabbit Health", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="rabbit-offspring-summary" options={{ title: "Offspring Summary", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="rabbit-offspring/[id]" options={{ title: "Offspring Details", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="app-configuration" options={{ title: "App Configuration" }} />
      <Stack.Screen 
        name="group-detail" 
        options={{ 
          title: "Group Details",
          headerStyle: { backgroundColor: colors.accent },
          headerBackVisible: true,
        }} 
      />
      <Stack.Screen name="mature-animals" options={{ presentation: "modal", title: "Mature Animals", headerShown: false }} />
      <Stack.Screen name="manage-animals" options={{ title: "Manage Animals", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="chicken-history" options={{ title: "Chicken History", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="duck-history" options={{ title: "Duck History", headerStyle: { backgroundColor: colors.accent } }} />
      <Stack.Screen name="voice-log" options={{ presentation: "modal", title: "Voice Log", headerStyle: { backgroundColor: colors.accent } }} />
      </Stack>
    </>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn('Error during app preparation:', e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {
          console.log('SplashScreen.hideAsync failed');
        });
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppSettingsProvider>
            <BackupProvider>
              <LivestockProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </LivestockProvider>
            </BackupProvider>
          </AppSettingsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});