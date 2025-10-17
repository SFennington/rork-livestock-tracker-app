import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LivestockProvider } from "@/hooks/livestock-store";
import { ThemeProvider } from "@/hooks/theme-store";
import { View, Text, StyleSheet, ActivityIndicator, StatusBar, Platform } from "react-native";

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
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-chicken" options={{ presentation: "modal", title: "Add Chicken" }} />
      <Stack.Screen name="add-rabbit" options={{ presentation: "modal", title: "Add Rabbit" }} />
      <Stack.Screen name="add-chicken-event" options={{ presentation: "modal", title: "Log Chicken Event" }} />
      <Stack.Screen name="add-expense" options={{ presentation: "modal", title: "Add Transaction" }} />
      <Stack.Screen name="add-income" options={{ presentation: "modal", title: "Add Income" }} />
      <Stack.Screen name="log-eggs" options={{ presentation: "modal", title: "Log Egg Production" }} />
      <Stack.Screen name="add-breeding" options={{ presentation: "modal", title: "Record Breeding" }} />
      <Stack.Screen name="breeding-calendar" options={{ title: "Breeding Calendar" }} />
      <Stack.Screen name="rabbit-health" options={{ title: "Rabbit Health" }} />
      <Stack.Screen name="rabbit-offspring-summary" options={{ title: "Offspring Summary" }} />
      <Stack.Screen name="rabbit-offspring/[id]" options={{ title: "Offspring Details" }} />
    </Stack>
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
          <LivestockProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              {Platform.OS === 'android' && (
                <StatusBar backgroundColor="#10b981" barStyle="light-content" translucent={false} />
              )}
              <RootLayoutNav />
            </GestureHandlerRootView>
          </LivestockProvider>
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