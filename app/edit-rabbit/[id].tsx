import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { DollarSign, Weight, Hash, FileText, Award, Heart, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function EditRabbitScreen() {
  const { colors } = useTheme();
  const { updateRabbit, deleteRabbit, rabbits } = useLivestock();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<'buck' | 'doe'>('doe');
  const [dateOfBirth, setDateOfBirth] = useState(getLocalDateString());
  const [dateAcquired, setDateAcquired] = useState(getLocalDateString());
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [tattoo, setTattoo] = useState("");
  const [earTag, setEarTag] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [showQuality, setShowQuality] = useState<'pet' | 'brood' | 'show'>('pet');
  const [temperament, setTemperament] = useState<'calm' | 'active' | 'aggressive' | 'shy'>('calm');
  const [feedingNotes, setFeedingNotes] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const rabbit = rabbits.find(r => r.id === id);
    if (rabbit) {
      setName(rabbit.name);
      setBreed(rabbit.breed);
      setGender(rabbit.gender);
      setDateOfBirth(rabbit.dateOfBirth);
      setDateAcquired(rabbit.dateAcquired);
      setCost(rabbit.cost.toString());
      setQuantity(rabbit.quantity?.toString() || "1");
      setColor(rabbit.color || "");
      setWeight(rabbit.weight?.toString() || "");
      setTattoo(rabbit.tattoo || "");
      setEarTag(rabbit.earTag || "");
      setRegistrationNumber(rabbit.registrationNumber || "");
      setShowQuality(rabbit.showQuality || 'pet');
      setTemperament(rabbit.temperament || 'calm');
      setFeedingNotes(rabbit.feedingNotes || "");
      setNotes(rabbit.notes || "");
    }
  }, [id, rabbits]);

  const handleSave = async () => {
    if (!name || !breed || !dateOfBirth || !dateAcquired || !cost || !quantity) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    await updateRabbit(id as string, {
      name,
      breed,
      gender,
      dateOfBirth,
      dateAcquired,
      cost: parseFloat(cost),
      quantity: parseInt(quantity),
      color: color || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      tattoo: tattoo || undefined,
      earTag: earTag || undefined,
      registrationNumber: registrationNumber || undefined,
      showQuality,
      temperament,
      feedingNotes: feedingNotes || undefined,
      lastWeightDate: weight ? getLocalDateString() : undefined,
      notes: notes || undefined,
    });

    router.back();
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        deleteRabbit(id as string);
        router.back();
      }
    } else {
      Alert.alert(
        "Delete Rabbit",
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteRabbit(id as string);
              router.back();
            }
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter rabbit name"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Breed *</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder="e.g., New Zealand White, Holland Lop, Flemish Giant"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderButtons}>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'buck' && [styles.genderButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setGender('buck')}
            >
              <Text style={[styles.genderButtonText, gender === 'buck' && styles.genderButtonTextActive]}>
                ♂ Buck
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'doe' && [styles.genderButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setGender('doe')}
            >
              <Text style={[styles.genderButtonText, gender === 'doe' && styles.genderButtonTextActive]}>
                ♀ Doe
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <DatePicker
            label="Date of Birth *"
            value={dateOfBirth}
            onChange={setDateOfBirth}
          />
        </View>

        <View style={styles.inputGroup}>
          <DatePicker
            label="Date Acquired *"
            value={dateAcquired}
            onChange={setDateAcquired}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <DollarSign size={16} color="#6b7280" />
            <Text style={styles.label}>Cost *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Hash size={16} color="#6b7280" />
            <Text style={styles.label}>Quantity *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color (optional)</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="e.g., White, Black, Spotted"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Weight size={16} color="#6b7280" />
            <Text style={styles.label}>Weight in lbs (optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="0.0"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Hash size={16} color="#6b7280" />
            <Text style={styles.label}>Tattoo ID (optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={tattoo}
            onChangeText={setTattoo}
            placeholder="Ear tattoo identification"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Hash size={16} color="#6b7280" />
            <Text style={styles.label}>Ear Tag (optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={earTag}
            onChangeText={setEarTag}
            placeholder="Ear tag number"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Award size={16} color="#6b7280" />
            <Text style={styles.label}>Registration Number (optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="ARBA registration number"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Show Quality</Text>
          <View style={styles.qualityButtons}>
            <TouchableOpacity 
              style={[styles.qualityButton, showQuality === 'pet' && [styles.qualityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setShowQuality('pet')}
            >
              <Text style={[styles.qualityButtonText, showQuality === 'pet' && styles.qualityButtonTextActive]}>
                Pet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.qualityButton, showQuality === 'brood' && [styles.qualityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setShowQuality('brood')}
            >
              <Text style={[styles.qualityButtonText, showQuality === 'brood' && styles.qualityButtonTextActive]}>
                Brood
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.qualityButton, showQuality === 'show' && [styles.qualityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setShowQuality('show')}
            >
              <Text style={[styles.qualityButtonText, showQuality === 'show' && styles.qualityButtonTextActive]}>
                Show
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Temperament</Text>
          <View style={styles.temperamentButtons}>
            <TouchableOpacity 
              style={[styles.temperamentButton, temperament === 'calm' && [styles.temperamentButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setTemperament('calm')}
            >
              <Text style={[styles.temperamentButtonText, temperament === 'calm' && styles.temperamentButtonTextActive]}>
                😌 Calm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.temperamentButton, temperament === 'active' && [styles.temperamentButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setTemperament('active')}
            >
              <Text style={[styles.temperamentButtonText, temperament === 'active' && styles.temperamentButtonTextActive]}>
                🏃 Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.temperamentButton, temperament === 'aggressive' && [styles.temperamentButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setTemperament('aggressive')}
            >
              <Text style={[styles.temperamentButtonText, temperament === 'aggressive' && styles.temperamentButtonTextActive]}>
                😠 Aggressive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.temperamentButton, temperament === 'shy' && [styles.temperamentButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
              onPress={() => setTemperament('shy')}
            >
              <Text style={[styles.temperamentButtonText, temperament === 'shy' && styles.temperamentButtonTextActive]}>
                😳 Shy
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Heart size={16} color="#6b7280" />
            <Text style={styles.label}>Feeding Notes (optional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={feedingNotes}
            onChangeText={setFeedingNotes}
            placeholder="Special dietary requirements, preferences, etc."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <FileText size={16} color="#6b7280" />
            <Text style={styles.label}>Notes (optional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional information"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={20} color="#dc2626" />
          <Text style={styles.deleteButtonText}>Delete Rabbit</Text>
        </TouchableOpacity>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Update Rabbit</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  genderButtons: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  genderButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  genderButtonTextActive: {
    color: "#fff",
  },
  qualityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  qualityButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  qualityButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  qualityButtonTextActive: {
    color: "#fff",
  },
  temperamentButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  temperamentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
    minWidth: "45%",
  },
  temperamentButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  temperamentButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  temperamentButtonTextActive: {
    color: "#fff",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
});