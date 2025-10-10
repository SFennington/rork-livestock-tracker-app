import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useLivestock } from "@/hooks/livestock-store";
import { Mic, CheckCircle, XCircle, Calendar, Egg, Heart, DollarSign, Scale } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VoiceInput from "@/components/VoiceInput";

interface ParsedEntry {
  id: string;
  type: 'eggs' | 'breeding' | 'expense' | 'weight';
  data: any;
  originalText: string;
  confirmed: boolean;
}

export default function VoiceLogScreen() {
  const { addEggProduction, addExpense, addWeightRecord, eggProduction } = useLivestock();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  console.log('=== VOICE LOG SCREEN RENDER ===');
  console.log('Current eggProduction from store:', JSON.stringify(eggProduction, null, 2));
  console.log('Current entries state:', JSON.stringify(entries, null, 2));

  const handleVoiceParsedData = (data: any) => {
    console.log('=== VOICE PARSED DATA HANDLER CALLED ===');
    console.log('Voice parsed data received:', JSON.stringify(data, null, 2));
    console.log('Data type:', typeof data);
    console.log('Data keys:', data ? Object.keys(data) : 'no keys');
    console.log('Current entries before update:', entries.length);
    
    if (data) {
      const newEntry: ParsedEntry = {
        id: Date.now().toString(),
        type: data.type,
        data,
        originalText: data.originalText,
        confirmed: false
      };
      console.log('=== CREATING NEW ENTRY ===');
      console.log('New entry:', JSON.stringify(newEntry, null, 2));
      
      setEntries(prev => {
        console.log('Previous entries in setter:', prev.length);
        const updated = [...prev, newEntry];
        console.log('=== UPDATED ENTRIES LIST ===', updated.length, 'entries');
        console.log('Updated entries:', JSON.stringify(updated, null, 2));
        return updated;
      });
      
      // Auto-confirm the entry after a short delay
      setTimeout(() => {
        console.log('=== AUTO-CONFIRMING ENTRY ===', newEntry.id);
        confirmEntry(newEntry.id);
      }, 1000);
    } else {
      console.log('❌ No data received from voice parsing');
    }
  };

  const confirmEntry = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) {
      console.log('Entry not found:', entryId);
      return;
    }

    console.log('=== CONFIRMING ENTRY ===');
    console.log('Entry to confirm:', JSON.stringify(entry, null, 2));
    console.log('Entry data type:', typeof entry.data);
    console.log('Entry data keys:', entry.data ? Object.keys(entry.data) : 'no keys');
    setIsProcessing(true);
    try {
      switch (entry.type) {
        case 'eggs':
          console.log('=== ADDING EGG PRODUCTION ===');
          console.log('Raw entry.data:', JSON.stringify(entry.data, null, 2));
          const eggData = {
            date: entry.data.date,
            count: entry.data.count,
            notes: entry.data.originalText || 'Voice entry',
          };
          console.log('Egg data to save:', JSON.stringify(eggData, null, 2));
          console.log('Calling addEggProduction with:', eggData);
          const eggResult = await addEggProduction(eggData);
          console.log('=== EGG PRODUCTION SAVED ===', JSON.stringify(eggResult, null, 2));
          break;
        case 'expense':
          console.log('=== ADDING EXPENSE ===');
          const expenseData = {
            category: 'other' as const,
            amount: entry.data.amount,
            date: entry.data.date,
            livestockType: 'general' as const,
            description: entry.data.description,
          };
          console.log('Expense data to save:', expenseData);
          const expenseResult = await addExpense(expenseData);
          console.log('=== EXPENSE SAVED ===', expenseResult);
          break;
        case 'weight':
          console.log('=== ADDING WEIGHT RECORD ===');
          const weightData = {
            rabbitId: 'voice-entry',
            date: entry.data.date,
            weight: entry.data.weight,
            notes: `Voice entry for ${entry.data.name}: ${entry.data.originalText}`,
          };
          console.log('Weight data to save:', weightData);
          const weightResult = await addWeightRecord(weightData);
          console.log('=== WEIGHT RECORD SAVED ===', weightResult);
          break;
        case 'breeding':
          console.log('Breeding entry would need rabbit ID matching:', entry.data);
          break;
      }
      
      console.log('=== ENTRY SAVED SUCCESSFULLY, UPDATING UI ===');
      setEntries(prev => {
        const updated = prev.map(e => 
          e.id === entryId ? { ...e, confirmed: true } : e
        );
        console.log('Updated entries list:', updated);
        return updated;
      });
    } catch (error) {
      console.error('=== ERROR SAVING ENTRY ===');
      console.error('Error:', error);
      console.error('Entry data:', entry);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'eggs': return <Egg size={20} color="#10b981" />;
      case 'breeding': return <Heart size={20} color="#ef4444" />;
      case 'expense': return <DollarSign size={20} color="#f59e0b" />;
      case 'weight': return <Scale size={20} color="#8b5cf6" />;
      default: return <Calendar size={20} color="#6b7280" />;
    }
  };

  const getEntryDescription = (entry: ParsedEntry) => {
    switch (entry.type) {
      case 'eggs':
        return `${entry.data.count} eggs on ${entry.data.date}`;
      case 'breeding':
        return `Bred ${entry.data.doe} with ${entry.data.buck} on ${entry.data.date}`;
      case 'expense':
        return `$${entry.data.amount} for ${entry.data.description} on ${entry.data.date}`;
      case 'weight':
        return `${entry.data.name} weighs ${entry.data.weight} lbs on ${entry.data.date}`;
      default:
        return entry.originalText;
    }
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Mic size={24} color="#10b981" />
            <Text style={styles.headerTitle}>Voice Logging</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Speak naturally to log your entries
          </Text>
        </View>

        <View style={styles.voiceSection}>
          <VoiceInput
            onTranscription={(text) => {
              console.log('=== TRANSCRIPTION RECEIVED IN VOICE LOG ===');
              console.log('Transcribed text:', JSON.stringify(text));
              setDebugInfo(`Transcribed: "${text}"`);
            }}
            onParsedData={(data) => {
              console.log('=== ON PARSED DATA CALLBACK TRIGGERED ===');
              console.log('Callback data:', JSON.stringify(data, null, 2));
              handleVoiceParsedData(data);
            }}
            placeholder="Say '6 eggs today' or 'spent $20 on feed'"
          />
          <Text style={styles.examples}>
            Try: {`"6 eggs today", "spent $20 on feed", "Bella weighs 5 pounds"`}
          </Text>
        </View>
        
        {/* Debug Section */}
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>Egg Production Count: {eggProduction.length}</Text>
          <Text style={styles.debugText}>Entries Count: {entries.length}</Text>
          {debugInfo && (
            <Text style={styles.debugText}>Status: {debugInfo}</Text>
          )}
          {eggProduction.length > 0 && (
            <Text style={styles.debugText}>Latest Egg: {JSON.stringify(eggProduction[eggProduction.length - 1])}</Text>
          )}
        </View>

        <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Mic size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Start speaking to log your livestock data</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={[
                styles.entryCard,
                entry.confirmed && styles.confirmedEntry
              ]}>
                <View style={styles.entryHeader}>
                  {getEntryIcon(entry.type)}
                  <Text style={styles.entryType}>{entry.type.toUpperCase()}</Text>
                  {entry.confirmed && (
                    <View style={styles.confirmedBadge}>
                      <CheckCircle size={16} color="#10b981" />
                      <Text style={styles.confirmedText}>Saved</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.entryDescription}>
                  {getEntryDescription(entry)}
                </Text>
                
                <Text style={styles.originalText}>
                  {`"${entry.originalText}"`}
                </Text>
                
                {!entry.confirmed && (
                  <View style={styles.entryActions}>
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={() => confirmEntry(entry.id)}
                      disabled={isProcessing}
                    >
                      <CheckCircle size={16} color="#fff" />
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeEntry(entry.id)}
                    >
                      <XCircle size={16} color="#ef4444" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: "#10b981",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  voiceSection: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  examples: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  entriesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#d1d5db",
    marginTop: 4,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  confirmedEntry: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  entryType: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    flex: 1,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
  },
  entryDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  originalText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
    marginBottom: 12,
  },
  entryActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  removeButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },

  debugSection: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    marginBottom: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
});