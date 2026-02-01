import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useLivestock, useRabbitHealth } from "@/hooks/livestock-store";
import { Heart, Syringe, Scale, Plus, X, Calendar, AlertTriangle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function RabbitHealthScreen() {
  const { rabbits } = useLivestock();
  const { dueVaccinations, addVaccination, addHealthRecord, addWeightRecord } = useRabbitHealth();
  const insets = useSafeAreaInsets();
  
  const [selectedRabbit, setSelectedRabbit] = useState<string>('');
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Vaccination form state
  const [vaccine, setVaccine] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDue, setNextDue] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [vaccinationNotes, setVaccinationNotes] = useState('');

  // Health record form state
  const [healthIssue, setHealthIssue] = useState('');
  const [treatment, setTreatment] = useState('');
  const [healthDate, setHealthDate] = useState(new Date().toISOString().split('T')[0]);
  const [healthCost, setHealthCost] = useState('');
  const [healthVet, setHealthVet] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Weight record form state
  const [weight, setWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightNotes, setWeightNotes] = useState('');

  const activeRabbits = rabbits.filter(r => r.status === 'active');

  const handleAddVaccination = async () => {
    if (!selectedRabbit || !vaccine || !vaccinationDate) return;

    await addVaccination({
      rabbitId: selectedRabbit,
      vaccine,
      date: vaccinationDate,
      nextDue: nextDue || undefined,
      veterinarian: veterinarian || undefined,
      notes: vaccinationNotes || undefined,
    });

    // Reset form
    setVaccine('');
    setVaccinationDate(new Date().toISOString().split('T')[0]);
    setNextDue('');
    setVeterinarian('');
    setVaccinationNotes('');
    setShowVaccinationModal(false);
  };

  const handleAddHealthRecord = async () => {
    if (!selectedRabbit || !healthIssue || !healthDate) return;

    await addHealthRecord({
      rabbitId: selectedRabbit,
      date: healthDate,
      issue: healthIssue,
      treatment: treatment || undefined,
      veterinarian: healthVet || undefined,
      cost: healthCost ? parseFloat(healthCost) : undefined,
      resolved: false,
      notes: healthNotes || undefined,
    });

    // Reset form
    setHealthIssue('');
    setTreatment('');
    setHealthDate(new Date().toISOString().split('T')[0]);
    setHealthCost('');
    setHealthVet('');
    setHealthNotes('');
    setShowHealthModal(false);
  };

  const handleAddWeightRecord = async () => {
    if (!selectedRabbit || !weight || !weightDate) return;

    await addWeightRecord({
      rabbitId: selectedRabbit,
      date: weightDate,
      weight: parseFloat(weight),
      notes: weightNotes || undefined,
    });

    // Reset form
    setWeight('');
    setWeightDate(new Date().toISOString().split('T')[0]);
    setWeightNotes('');
    setShowWeightModal(false);
  };

  const getRabbitName = (id: string) => {
    const rabbit = rabbits.find(r => r.id === id);
    return rabbit?.name || 'Unknown';
  };

  const commonVaccines = [
    'RHDV (Rabbit Hemorrhagic Disease)',
    'Myxomatosis',
    'Pasteurella',
    'E. cuniculi',
    'Annual Health Check'
  ];

  const commonHealthIssues = [
    'Snuffles (Upper Respiratory)',
    'GI Stasis',
    'Ear Mites',
    'Sore Hocks',
    'Dental Issues',
    'Skin Condition',
    'Eye Infection',
    'Urinary Issues',
    'Injury',
    'Other'
  ];

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowVaccinationModal(true)}
              >
                <Syringe size={20} color="#10b981" />
                <Text style={styles.actionButtonText}>Add Vaccination</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowHealthModal(true)}
              >
                <Heart size={20} color="#ef4444" />
                <Text style={styles.actionButtonText}>Log Health Issue</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowWeightModal(true)}
              >
                <Scale size={20} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Record Weight</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Due Vaccinations */}
          {dueVaccinations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={20} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Due Vaccinations</Text>
              </View>
              {dueVaccinations.map((vaccination) => (
                <View key={vaccination.id} style={[styles.card, styles.urgentCard]}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{getRabbitName(vaccination.rabbitId)}</Text>
                      <Text style={styles.cardSubtitle}>{vaccination.vaccine}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#f59e0b' }]}>
                      <Text style={styles.statusText}>Due</Text>
                    </View>
                  </View>
                  <Text style={styles.detailText}>
                    Due: {vaccination.nextDue ? new Date(vaccination.nextDue).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Rabbit Health Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rabbit Health Overview</Text>
            {activeRabbits.map((rabbit) => (
              <View key={rabbit.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{rabbit.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {rabbit.breed} • {rabbit.gender === 'buck' ? '♂ Buck' : '♀ Doe'}
                    </Text>
                  </View>
                  <View style={styles.healthIndicators}>
                    {rabbit.lastHealthCheck && (
                      <View style={[styles.indicator, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.indicatorText}>✓</Text>
                      </View>
                    )}
                    {rabbit.weight && (
                      <View style={[styles.indicator, { backgroundColor: '#3b82f6' }]}>
                        <Text style={styles.indicatorText}>{rabbit.weight}lb</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  {rabbit.lastHealthCheck && (
                    <Text style={styles.detailText}>
                      Last Check: {new Date(rabbit.lastHealthCheck).toLocaleDateString()}
                    </Text>
                  )}
                  {rabbit.temperament && (
                    <Text style={styles.detailText}>
                      Temperament: {rabbit.temperament}
                    </Text>
                  )}
                  {rabbit.feedingNotes && (
                    <Text style={styles.detailText}>
                      Feeding: {rabbit.feedingNotes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Vaccination Modal */}
        <Modal visible={showVaccinationModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Vaccination</Text>
                <TouchableOpacity onPress={() => setShowVaccinationModal(false)}>
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rabbit *</Text>
                  <View style={styles.rabbitButtons}>
                    {activeRabbits.map((rabbit) => (
                      <TouchableOpacity
                        key={rabbit.id}
                        style={[
                          styles.rabbitButton,
                          selectedRabbit === rabbit.id && styles.rabbitButtonActive
                        ]}
                        onPress={() => setSelectedRabbit(rabbit.id)}
                      >
                        <Text style={[
                          styles.rabbitButtonText,
                          selectedRabbit === rabbit.id && styles.rabbitButtonTextActive
                        ]}>
                          {rabbit.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vaccine *</Text>
                  <View style={styles.vaccineButtons}>
                    {commonVaccines.map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.vaccineButton,
                          vaccine === v && styles.vaccineButtonActive
                        ]}
                        onPress={() => setVaccine(v)}
                      >
                        <Text style={[
                          styles.vaccineButtonText,
                          vaccine === v && styles.vaccineButtonTextActive
                        ]}>
                          {v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    value={vaccine}
                    onChangeText={setVaccine}
                    placeholder="Or enter custom vaccine"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <DatePicker
                    label="Date *"
                    value={vaccinationDate}
                    onChange={setVaccinationDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <DatePicker
                    label="Next Due Date"
                    value={nextDue}
                    onChange={setNextDue}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Veterinarian</Text>
                  <TextInput
                    style={styles.input}
                    value={veterinarian}
                    onChangeText={setVeterinarian}
                    placeholder="Vet name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={vaccinationNotes}
                    onChangeText={setVaccinationNotes}
                    placeholder="Additional notes"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowVaccinationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddVaccination}>
                  <Text style={styles.saveButtonText}>Add Vaccination</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Health Record Modal */}
        <Modal visible={showHealthModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Health Issue</Text>
                <TouchableOpacity onPress={() => setShowHealthModal(false)}>
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rabbit *</Text>
                  <View style={styles.rabbitButtons}>
                    {activeRabbits.map((rabbit) => (
                      <TouchableOpacity
                        key={rabbit.id}
                        style={[
                          styles.rabbitButton,
                          selectedRabbit === rabbit.id && styles.rabbitButtonActive
                        ]}
                        onPress={() => setSelectedRabbit(rabbit.id)}
                      >
                        <Text style={[
                          styles.rabbitButtonText,
                          selectedRabbit === rabbit.id && styles.rabbitButtonTextActive
                        ]}>
                          {rabbit.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Health Issue *</Text>
                  <View style={styles.issueButtons}>
                    {commonHealthIssues.map((issue) => (
                      <TouchableOpacity
                        key={issue}
                        style={[
                          styles.issueButton,
                          healthIssue === issue && styles.issueButtonActive
                        ]}
                        onPress={() => setHealthIssue(issue)}
                      >
                        <Text style={[
                          styles.issueButtonText,
                          healthIssue === issue && styles.issueButtonTextActive
                        ]}>
                          {issue}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    value={healthIssue}
                    onChangeText={setHealthIssue}
                    placeholder="Or describe the issue"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Treatment</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={treatment}
                    onChangeText={setTreatment}
                    placeholder="Treatment provided"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <DatePicker
                    label="Date *"
                    value={healthDate}
                    onChange={setHealthDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cost</Text>
                  <TextInput
                    style={styles.input}
                    value={healthCost}
                    onChangeText={setHealthCost}
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Veterinarian</Text>
                  <TextInput
                    style={styles.input}
                    value={healthVet}
                    onChangeText={setHealthVet}
                    placeholder="Vet name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={healthNotes}
                    onChangeText={setHealthNotes}
                    placeholder="Additional notes"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowHealthModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddHealthRecord}>
                  <Text style={styles.saveButtonText}>Log Health Issue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Weight Record Modal */}
        <Modal visible={showWeightModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Record Weight</Text>
                <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rabbit *</Text>
                  <View style={styles.rabbitButtons}>
                    {activeRabbits.map((rabbit) => (
                      <TouchableOpacity
                        key={rabbit.id}
                        style={[
                          styles.rabbitButton,
                          selectedRabbit === rabbit.id && styles.rabbitButtonActive
                        ]}
                        onPress={() => setSelectedRabbit(rabbit.id)}
                      >
                        <Text style={[
                          styles.rabbitButtonText,
                          selectedRabbit === rabbit.id && styles.rabbitButtonTextActive
                        ]}>
                          {rabbit.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Weight (lbs) *</Text>
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
                  <DatePicker
                    label="Date *"
                    value={weightDate}
                    onChange={setWeightDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={weightNotes}
                    onChangeText={setWeightNotes}
                    placeholder="Additional notes"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowWeightModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddWeightRecord}>
                  <Text style={styles.saveButtonText}>Record Weight</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  urgentCard: {
    borderColor: "#f59e0b",
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  healthIndicators: {
    flexDirection: "row",
    gap: 4,
  },
  indicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  indicatorText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  cardDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  rabbitButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  rabbitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  rabbitButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  rabbitButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  rabbitButtonTextActive: {
    color: "#fff",
  },
  vaccineButtons: {
    gap: 8,
    marginBottom: 12,
  },
  vaccineButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  vaccineButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  vaccineButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  vaccineButtonTextActive: {
    color: "#fff",
  },
  issueButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  issueButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  issueButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  issueButtonText: {
    fontSize: 12,
    color: "#6b7280",
  },
  issueButtonTextActive: {
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
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
});