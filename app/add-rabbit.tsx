import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { DollarSign, Weight, Hash, FileText, Award, Heart, Calendar, ChevronDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { RABBIT_BREEDS } from "@/constants/breeds";

export default function AddRabbitScreen() {
  const { addRabbit } = useLivestock();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<'buck' | 'doe'>('doe');
  const [dateOfBirth, setDateOfBirth] = useState(new Date().toISOString().split('T')[0]);
  const [dateAcquired, setDateAcquired] = useState(new Date().toISOString().split('T')[0]);
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
  const [showBirthCalendar, setShowBirthCalendar] = useState(false);
  const [showAcquiredCalendar, setShowAcquiredCalendar] = useState(false);

  const getDateString = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!name || !breed || !dateOfBirth || !dateAcquired || !cost || !quantity) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    await addRabbit({
      name,
      breed,
      gender,
      dateOfBirth,
      dateAcquired,
      cost: parseFloat(cost),
      quantity: parseInt(quantity),
      status: 'active',
      color: color || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      tattoo: tattoo || undefined,
      earTag: earTag || undefined,
      registrationNumber: registrationNumber || undefined,
      showQuality,
      temperament,
      feedingNotes: feedingNotes || undefined,
      lastWeightDate: weight ? new Date().toISOString().split('T')[0] : undefined,
      notes: notes || undefined,
    });

    router.back();
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
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
          <BreedPicker
            label="Breed *"
            value={breed}
            onChange={setBreed}
            breeds={RABBIT_BREEDS}
            placeholder="Select rabbit breed"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderButtons}>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'buck' && styles.genderButtonActive]}
              onPress={() => setGender('buck')}
            >
              <Text style={[styles.genderButtonText, gender === 'buck' && styles.genderButtonTextActive]}>
                ♂ Buck
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'doe' && styles.genderButtonActive]}
              onPress={() => setGender('doe')}
            >
              <Text style={[styles.genderButtonText, gender === 'doe' && styles.genderButtonTextActive]}>
                ♀ Doe
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.label}>Date of Birth *</Text>
          </View>
          
          <View style={styles.quickDateButtons}>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateOfBirth === getDateString(0) && styles.quickDateButtonActive]}
              onPress={() => setDateOfBirth(getDateString(0))}
            >
              <Text style={[styles.quickDateText, dateOfBirth === getDateString(0) && styles.quickDateTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateOfBirth === getDateString(1) && styles.quickDateButtonActive]}
              onPress={() => setDateOfBirth(getDateString(1))}
            >
              <Text style={[styles.quickDateText, dateOfBirth === getDateString(1) && styles.quickDateTextActive]}>
                Yesterday
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateOfBirth === getDateString(2) && styles.quickDateButtonActive]}
              onPress={() => setDateOfBirth(getDateString(2))}
            >
              <Text style={[styles.quickDateText, dateOfBirth === getDateString(2) && styles.quickDateTextActive]}>
                2 Days Ago
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.calendarToggle}
            onPress={() => setShowBirthCalendar(!showBirthCalendar)}
          >
            <Text style={styles.calendarToggleText}>
              {showBirthCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </Text>
            <ChevronDown size={16} color="#6b7280" style={[showBirthCalendar && { transform: [{ rotate: '180deg' }] }]} />
          </TouchableOpacity>

          {showBirthCalendar && (
            <DatePicker
              label=""
              value={dateOfBirth}
              onChange={setDateOfBirth}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.label}>Date Acquired *</Text>
          </View>
          
          <View style={styles.quickDateButtons}>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateAcquired === getDateString(0) && styles.quickDateButtonActive]}
              onPress={() => setDateAcquired(getDateString(0))}
            >
              <Text style={[styles.quickDateText, dateAcquired === getDateString(0) && styles.quickDateTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateAcquired === getDateString(1) && styles.quickDateButtonActive]}
              onPress={() => setDateAcquired(getDateString(1))}
            >
              <Text style={[styles.quickDateText, dateAcquired === getDateString(1) && styles.quickDateTextActive]}>
                Yesterday
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateAcquired === getDateString(2) && styles.quickDateButtonActive]}
              onPress={() => setDateAcquired(getDateString(2))}
            >
              <Text style={[styles.quickDateText, dateAcquired === getDateString(2) && styles.quickDateTextActive]}>
                2 Days Ago
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.calendarToggle}
            onPress={() => setShowAcquiredCalendar(!showAcquiredCalendar)}
          >
            <Text style={styles.calendarToggleText}>
              {showAcquiredCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </Text>
            <ChevronDown size={16} color="#6b7280" style={[showAcquiredCalendar && { transform: [{ rotate: '180deg' }] }]} />
          </TouchableOpacity>

          {showAcquiredCalendar && (
            <DatePicker
              label=""
              value={dateAcquired}
              onChange={setDateAcquired}
            />
          )}
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
              style={[styles.qualityButton, showQuality === 'pet' && styles.qualityButtonActive]}
              onPress={() => setShowQuality('pet')}
            >
              <Text style={[styles.qualityButtonText, showQuality === 'pet' && styles.qualityButtonTextActive]}>
                Pet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.qualityButton, showQuality === 'brood' && styles.qualityButtonActive]}
              onPress={() => setShowQuality('brood')}
            >
              <Text style={[styles.qualityButtonText, showQuality === 'brood' && styles.qualityButtonTextActive]}>
                Brood
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.qualityButton, showQuality === 'show' && styles.qualityButtonActive]}
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
              style={[styles.temperamentButton, temperament === 'calm' && styles.temperamentButtonActive]}
              onPress={() => setTemperament('calm')}
            >
              <Text style={[styles.temperamentButtonText, temperament === 'calm' && styles.temperamentButtonTextActive]}>
                😌 Calm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.temperamentButton, temperament === 'active' && styles.temperamentButtonActive]}
              onPress={() => setTemperament('active')}
            >
              <Text style={[styles.temperamentButtonText, temperament === 'active' && styles.temperamentButtonTextActive]}>
                🏃 Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.temperamentButton, temperament === 'aggressive' && styles.temperamentButtonActive]}
              onPress={() => setTemperament('aggressive')}
            >
              <Text style={[styles.temperamentButtonText, temperament === 'aggressive' && styles.temperamentButtonTextActive]}>
                😠 Aggressive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.temperamentButton, temperament === 'shy' && styles.temperamentButtonActive]}
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

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Add Rabbit</Text>
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
  quickDateButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  quickDateButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  quickDateText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  quickDateTextActive: {
    color: "#fff",
  },
  calendarToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  calendarToggleText: {
    fontSize: 13,
    color: "#6b7280",
  },
});