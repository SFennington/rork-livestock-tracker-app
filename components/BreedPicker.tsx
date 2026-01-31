import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, TextInput } from "react-native";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react-native";

interface BreedPickerProps {
  value: string;
  onChange: (breed: string) => void;
  breeds: string[];
  usedBreeds?: string[];
  onAddCustomBreed?: (breed: string) => void;
  label?: string;
  placeholder?: string;
  maxVisibleItems?: number;
  modalTitle?: string;
}

export default function BreedPicker({ value, onChange, breeds, usedBreeds = [], onAddCustomBreed, label, placeholder = "Select breed", maxVisibleItems = 6, modalTitle = "Select Breed" }: BreedPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [customBreed, setCustomBreed] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Sort breeds: 1) Used breeds alphabetically, 2) Unused breeds alphabetically, 3) "Other"
  const sortedBreeds = [...breeds].sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    
    const aUsed = usedBreeds.includes(a);
    const bUsed = usedBreeds.includes(b);
    
    if (aUsed && !bUsed) return -1;
    if (!aUsed && bUsed) return 1;
    
    return a.localeCompare(b);
  });

  const handleSelect = (breed: string) => {
    if (breed === 'Other') {
      setShowCustomInput(true);
    } else {
      onChange(breed);
      setShowPicker(false);
      setShowCustomInput(false);
      setCustomBreed("");
    }
  };

  const handleCustomSubmit = () => {
    if (customBreed.trim()) {
      const trimmedBreed = customBreed.trim();
      onChange(trimmedBreed);
      if (onAddCustomBreed) {
        onAddCustomBreed(trimmedBreed);
      }
      setShowPicker(false);
      setShowCustomInput(false);
      setCustomBreed("");
    }
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPicker(false);
          setShowCustomInput(false);
          setCustomBreed("");
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowPicker(false);
            setShowCustomInput(false);
            setCustomBreed("");
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{modalTitle}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPicker(false);
                    setShowCustomInput(false);
                    setCustomBreed("");
                  }}
                  style={styles.closeButton}
                >
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {showCustomInput ? (
                <View style={styles.customInputContainer}>
                  <Text style={styles.customInputLabel}>Enter custom breed:</Text>
                  <TextInput
                    style={styles.customInput}
                    value={customBreed}
                    onChangeText={setCustomBreed}
                    placeholder="Enter breed name"
                    placeholderTextColor="#9ca3af"
                    autoFocus
                  />
                  <View style={styles.customInputButtons}>
                    <TouchableOpacity
                      style={styles.customInputCancelButton}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomBreed("");
                      }}
                    >
                      <Text style={styles.customInputCancelText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.customInputSubmitButton, !customBreed.trim() && styles.customInputSubmitButtonDisabled]}
                      onPress={handleCustomSubmit}
                      disabled={!customBreed.trim()}
                    >
                      <Text style={styles.customInputSubmitText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <ScrollView 
                  style={[
                    styles.breedList, 
                    { maxHeight: maxVisibleItems * 50 }
                  ]} 
                  showsVerticalScrollIndicator={true}
                >
                  {sortedBreeds.map((breed) => (
                    <TouchableOpacity
                      key={breed}
                      style={[
                        styles.breedItem,
                        value === breed && styles.breedItemSelected,
                      ]}
                      onPress={() => handleSelect(breed)}
                    >
                      <Text
                        style={[
                          styles.breedItemText,
                          value === breed && styles.breedItemTextSelected,
                        ]}
                      >
                        {breed}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholder: {
    color: "#9ca3af",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 340,
    maxWidth: "90%",
    maxHeight: "80%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  breedList: {
    maxHeight: 400,
  },
  breedItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  breedItemSelected: {
    backgroundColor: "#ecfdf5",
  },
  breedItemText: {
    fontSize: 16,
    color: "#111827",
  },
  breedItemTextSelected: {
    color: "#10b981",
    fontWeight: "600",
  },
  customInputContainer: {
    padding: 20,
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  customInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  customInputButtons: {
    flexDirection: "row",
    gap: 12,
  },
  customInputCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  customInputCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  customInputSubmitButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  customInputSubmitButtonDisabled: {
    opacity: 0.5,
  },
  customInputSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
