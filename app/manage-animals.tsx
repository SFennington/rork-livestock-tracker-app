import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { X, Plus, Save, Trash2, Eye, EyeOff, Skull } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS, RABBIT_BREEDS } from "@/constants/breeds";
import type { IndividualAnimal } from "@/types/livestock";

export default function ManageAnimalsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const {
    animals,
    addAnimal,
    addAnimalsBatch,
    updateAnimal,
    removeAnimal,
    getAliveAnimals,
    getAllAnimals,
    chickenHistory,
    rabbits,
    getChickenCountOnDate,
    addChickenHistoryEvent,
  } = useLivestock();

  const [filterType, setFilterType] = useState<'chicken' | 'rabbit' | 'goat' | 'duck'>((params.type as any) ?? 'chicken');
  const [filterBreed, setFilterBreed] = useState<string>((params.breed as string) ?? '');
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showDeathDialog, setShowDeathDialog] = useState(false);
  const [selectedAnimalForDeath, setSelectedAnimalForDeath] = useState<IndividualAnimal | null>(null);
  
  const [form, setForm] = useState<{
    name?: string;
    number?: string;
    notes?: string;
    sex?: 'M' | 'F';
  }>({});

  const [batchForm, setBatchForm] = useState<{
    breed: string;
    count: string;
    dateAdded: string;
    sex?: 'M' | 'F';
  }>({
    breed: filterBreed,
    count: '',
    dateAdded: new Date().toISOString().split('T')[0],
    sex: undefined,
  });

  // Breed name normalization - map abbreviated names to full names
  const breedNameMap: Record<string, string> = {
    'RIR': 'Rhode Island Red',
    'BO': 'Orpington',
    'PR': 'Plymouth Rock (Barred)',
    'ISA': 'ISA Brown',
    'WL': 'White Leghorn',
  };

  const getFullBreedName = (breed: string): string => {
    return breedNameMap[breed] || breed;
  };

  // Auto-populate animals from breed counts on first load
  useEffect(() => {
    const checkAndPopulate = async () => {
      // If breed is specified but no animals exist for that breed/type, check if we need to create them
      if (filterBreed && filterType === 'chicken') {
        const existing = getAllAnimals(filterType, filterBreed);
        if (existing.length === 0) {
          // Check if there's a chicken count from history
          const today = new Date().toISOString().split('T')[0];
          const breakdown: { [breed: string]: number } = {};
          const sortedEvents = [...chickenHistory].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          for (const event of sortedEvents) {
            if (new Date(event.date).getTime() > new Date(today).getTime()) break;
            const breed = event.breed || 'Unknown';
            if (!breakdown[breed]) breakdown[breed] = 0;
            
            if (event.type === 'acquired') {
              breakdown[breed] += event.quantity;
            } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
              breakdown[breed] -= event.quantity;
            }
          }
          
          const count = breakdown[filterBreed] || 0;
          if (count > 0) {
            // Create individual animals
            const newAnimals: Omit<IndividualAnimal, 'id'>[] = [];
            for (let i = 1; i <= count; i++) {
              newAnimals.push({
                type: 'chicken',
                breed: filterBreed,
                number: i,
                dateAdded: today,
                status: 'alive',
              });
            }
            await addAnimalsBatch(newAnimals);
          }
        }
      } else if (filterBreed && filterType === 'rabbit') {
        const existing = getAllAnimals(filterType, filterBreed);
        if (existing.length === 0) {
          // Check rabbit breed count
          const activeRabbits = rabbits.filter(r => r.status === 'active' && r.breed === filterBreed);
          const count = activeRabbits.reduce((sum, r) => sum + r.quantity, 0);
          
          if (count > 0) {
            const newAnimals: Omit<IndividualAnimal, 'id'>[] = [];
            const today = new Date().toISOString().split('T')[0];
            for (let i = 1; i <= count; i++) {
              newAnimals.push({
                type: 'rabbit',
                breed: filterBreed,
                number: i,
                dateAdded: today,
                status: 'alive',
              });
            }
            await addAnimalsBatch(newAnimals);
          }
        }
      }
    };
    
    checkAndPopulate();
  }, [filterBreed, filterType]);

  const filteredAnimals = useMemo(() => {
    const list = showAll 
      ? getAllAnimals(filterType, filterBreed || undefined)
      : getAliveAnimals(filterType, filterBreed || undefined);
    
    // If no animals found and a breed filter is active, try to find close matches (case-insensitive, partial match)
    if (list.length === 0 && filterBreed) {
      const allAnimals = showAll ? getAllAnimals(filterType) : getAliveAnimals(filterType);
      const lowerFilterBreed = filterBreed.toLowerCase();
      const closeMatches = allAnimals.filter(a => 
        a.breed.toLowerCase().includes(lowerFilterBreed) || 
        lowerFilterBreed.includes(a.breed.toLowerCase())
      );
      if (closeMatches.length > 0) {
        return closeMatches.sort((a, b) => {
          if (a.breed !== b.breed) return a.breed.localeCompare(b.breed);
          return a.number - b.number;
        });
      }
    }
    
    return list.sort((a, b) => {
      if (a.breed !== b.breed) return a.breed.localeCompare(b.breed);
      return a.number - b.number;
    });
  }, [filterType, filterBreed, showAll, getAllAnimals, getAliveAnimals]);

  const getBreedList = (): string[] => {
    // Get unique breeds from alive animals of the selected type
    const aliveAnimals = getAliveAnimals(filterType);
    const uniqueBreeds = Array.from(new Set(aliveAnimals.map(a => a.breed)));
    
    // Sort breeds alphabetically and add 'Other' at the end if not present
    const sorted = uniqueBreeds.sort((a, b) => a.localeCompare(b));
    if (!sorted.includes('Other')) {
      sorted.push('Other');
    }
    
    return sorted.length > 0 ? sorted : [
      ...(filterType === 'chicken' ? CHICKEN_BREEDS : RABBIT_BREEDS)
    ];
  };

  const handleSaveEdit = async (animal: IndividualAnimal) => {
    try {
      const newNumber = form.number ? parseInt(form.number, 10) : animal.number;
      
      // Check for duplicate number in the same type and breed
      const duplicate = animals.find(
        a => a.id !== animal.id && 
             a.type === animal.type && 
             a.breed === animal.breed && 
             a.number === newNumber &&
             a.status === 'alive'
      );
      
      if (duplicate) {
        Alert.alert(
          'Duplicate Number', 
          `Number ${newNumber} is already assigned to another ${animal.breed} ${animal.type}.`
        );
        return;
      }
      
      await updateAnimal(animal.id, {
        name: form.name,
        number: newNumber,
        notes: form.notes,
        sex: form.sex,
      });
      setEditingId(null);
      setForm({});
    } catch (error) {
      Alert.alert('Error', 'Failed to update animal');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Animal',
      'Are you sure you want to delete this animal record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAnimal(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete animal');
            }
          },
        },
      ]
    );
  };

  const handleDeathEvent = async (eventType: 'death' | 'consumed') => {
    if (!selectedAnimalForDeath) return;

    try {
      await addChickenHistoryEvent({
        type: eventType,
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
        breed: selectedAnimalForDeath.breed,
        notes: `${selectedAnimalForDeath.name || `#${selectedAnimalForDeath.number}`}`,
      });
      await updateAnimal(selectedAnimalForDeath.id, { status: 'dead' });
      setShowDeathDialog(false);
      setSelectedAnimalForDeath(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to record death event');
    }
  };

  const handleAddSingle = async () => {
    if (!batchForm.breed.trim()) {
      Alert.alert('Error', 'Please select a breed');
      return;
    }

    try {
      await addAnimal({
        type: filterType,
        breed: batchForm.breed,
        name: form.name,
        dateAdded: batchForm.dateAdded,
        status: 'alive',
        notes: form.notes,
      });
      setShowAddForm(false);
      setForm({});
      setBatchForm(prev => ({ ...prev, breed: filterBreed, count: '', dateAdded: new Date().toISOString().split('T')[0] }));
    } catch (error) {
      Alert.alert('Error', 'Failed to add animal');
    }
  };

  const handleBatchCreate = async () => {
    const count = parseInt(batchForm.count, 10);
    
    if (!batchForm.breed.trim()) {
      Alert.alert('Error', 'Please select a breed');
      return;
    }
    
    if (isNaN(count) || count < 1) {
      Alert.alert('Error', 'Please enter a valid count');
      return;
    }

    try {
      await addAnimalsBatch(filterType, batchForm.breed, count, batchForm.dateAdded, batchForm.sex);
      setShowBatchForm(false);
      setBatchForm(prev => ({ ...prev, breed: filterBreed, count: '', dateAdded: new Date().toISOString().split('T')[0], sex: undefined }));
    } catch (error) {
      Alert.alert('Error', 'Failed to create animals');
    }
  };

  const handleMigrateData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const breakdown: { [breed: string]: number } = {};
      const sortedEvents = [...chickenHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      for (const event of sortedEvents) {
        if (new Date(event.date).getTime() > new Date(today).getTime()) break;
        const breed = event.breed || 'Unknown';
        if (!breakdown[breed]) breakdown[breed] = 0;
        
        if (event.type === 'acquired') {
          breakdown[breed] += event.quantity;
        } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
          breakdown[breed] -= event.quantity;
        }
      }
      
      let totalCreated = 0;
      for (const [breed, count] of Object.entries(breakdown)) {
        if (count > 0) {
          await addAnimalsBatch('chicken', breed, count, today);
          totalCreated += count;
        }
      }
      
      Alert.alert('Success', `Created ${totalCreated} chickens from history data`);
    } catch (error) {
      Alert.alert('Error', 'Migration failed: ' + error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Manage {filterType}s</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowAll(!showAll)} style={styles.headerButton}>
            {showAll ? <EyeOff size={20} color={colors.text} /> : <Eye size={20} color={colors.text} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowBatchForm(true)} style={styles.headerButton}>
            <Plus size={20} color={colors.text} />
            <Text style={[styles.headerButtonText, { color: colors.text }]}>Batch</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.headerButton}>
            <Plus size={20} color={colors.text} />
            <Text style={[styles.headerButtonText, { color: colors.text }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.filters, { borderBottomColor: colors.border }]}>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Type:</Text>
          <View style={styles.typeButtons}>
            {(['chicken', 'rabbit', 'goat', 'duck'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  filterType === type && { backgroundColor: colors.primary },
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text style={[styles.typeButtonText, { color: filterType === type ? '#fff' : colors.text }]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Breed:</Text>
          <BreedPicker
            breeds={getBreedList()}
            value={filterBreed}
            onChange={setFilterBreed}
            placeholder="All breeds"
          />
        </View>
      </View>

      <ScrollView style={styles.list}>
        {filteredAnimals.length === 0 && filterBreed ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {filterType}s found for {filterBreed}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Migration may not have run. Check your data on the livestock tab.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary, marginTop: 10 }]}>
              Debug: animals.length = {animals.length}, filterType = {filterType}, filterBreed = {filterBreed}
            </Text>
            {animals.length === 0 && (
              <TouchableOpacity 
                style={[styles.migrateButton, { backgroundColor: colors.primary, marginTop: 20 }]}
                onPress={handleMigrateData}
              >
                <Text style={styles.migrateButtonText}>Migrate Data from History</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filteredAnimals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {filterType}s found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Tap the + button to add {filterType}s
            </Text>
          </View>
        ) : (
          filteredAnimals.map((animal) => (
            <View
              key={animal.id}
              style={[
                styles.animalCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                animal.status !== 'alive' && styles.animalCardInactive,
              ]}
            >
              {editingId === animal.id ? (
                <View style={styles.editForm}>
                  <View style={styles.editRow}>
                    <Text style={[styles.editLabel, { color: colors.text }]}>Number:</Text>
                    <TextInput
                      style={[styles.editInput, { borderColor: colors.border, color: colors.text }]}
                      value={form.number ?? String(animal.number)}
                      onChangeText={(t) => setForm(prev => ({ ...prev, number: t }))}
                      keyboardType="numeric"
                      placeholder="Number"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={[styles.editLabel, { color: colors.text }]}>Name:</Text>
                    <TextInput
                      style={[styles.editInput, { borderColor: colors.border, color: colors.text }]}
                      value={form.name ?? animal.name ?? ''}
                      onChangeText={(t) => setForm(prev => ({ ...prev, name: t }))}
                      placeholder="Optional"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={[styles.editLabel, { color: colors.text }]}>Notes:</Text>
                    <TextInput
                      style={[styles.editInput, styles.editInputMulti, { borderColor: colors.border, color: colors.text }]}
                      value={form.notes ?? animal.notes ?? ''}
                      onChangeText={(t) => setForm(prev => ({ ...prev, notes: t }))}
                      placeholder="Optional"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                  {filterType === 'chicken' && (
                    <View style={styles.editRow}>
                      <Text style={[styles.editLabel, { color: colors.text }]}>Gender:</Text>
                      <View style={styles.genderButtons}>
                        <TouchableOpacity
                          style={[
                            styles.genderButton,
                            { borderColor: colors.border },
                            (form.sex ?? animal.sex) === 'M' && { backgroundColor: colors.primary },
                          ]}
                          onPress={() => setForm(prev => ({ ...prev, sex: 'M' }))}
                        >
                          <Text style={[styles.genderButtonText, { color: (form.sex ?? animal.sex) === 'M' ? '#fff' : colors.text }]}>Rooster</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.genderButton,
                            { borderColor: colors.border },
                            (form.sex ?? animal.sex) === 'F' && { backgroundColor: colors.primary },
                          ]}
                          onPress={() => setForm(prev => ({ ...prev, sex: 'F' }))}
                        >
                          <Text style={[styles.genderButtonText, { color: (form.sex ?? animal.sex) === 'F' ? '#fff' : colors.text }]}>Hen</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleSaveEdit(animal)}
                    >
                      <Save size={16} color="#fff" />
                      <Text style={styles.editButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: colors.border }]}
                      onPress={() => {
                        setEditingId(null);
                        setForm({});
                      }}
                    >
                      <X size={16} color={colors.text} />
                      <Text style={[styles.editButtonText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.animalContent}
                  onPress={() => {
                    setEditingId(animal.id);
                    setForm({
                      name: animal.name,
                      number: String(animal.number),
                      notes: animal.notes,
                      sex: animal.sex,
                    });
                  }}
                >
                  <View style={styles.animalHeader}>
                    <Text style={[styles.animalNumber, { color: colors.text }]}>
                      #{animal.number}
                    </Text>
                    {animal.name && (
                      <Text style={[styles.animalName, { color: colors.text }]} numberOfLines={1}>
                        {animal.name}
                      </Text>
                    )}
                    <Text style={[styles.animalStatus, { color: animal.status === 'alive' ? colors.success : colors.textSecondary }]}>
                      {animal.status}
                    </Text>
                  </View>
                  <Text style={[styles.animalBreed, { color: colors.text }]}>
                    {getFullBreedName(animal.breed)}
                  </Text>
                  {animal.notes && (
                    <Text style={[styles.animalNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                      {animal.notes}
                    </Text>
                  )}
                  <Text style={[styles.animalDate, { color: colors.textSecondary }]}>
                    Added: {animal.dateAdded}
                  </Text>
                  {animal.status === 'alive' && (
                    <>
                      <TouchableOpacity
                        style={styles.deathButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedAnimalForDeath(animal);
                          setShowDeathDialog(true);
                        }}
                      >
                        <Skull size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(animal.id);
                        }}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Single Form Modal */}
      {showAddForm && (
        <View style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add {filterType}</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Breed:</Text>
              <BreedPicker
                breeds={getBreedList()}
                value={batchForm.breed}
                onChange={(b) => setBatchForm(prev => ({ ...prev, breed: b }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Name (optional):</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                value={form.name ?? ''}
                onChangeText={(t) => setForm(prev => ({ ...prev, name: t }))}
                placeholder="Optional"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Notes (optional):</Text>
              <TextInput
                style={[styles.formInput, styles.formInputMulti, { borderColor: colors.border, color: colors.text }]}
                value={form.notes ?? ''}
                onChangeText={(t) => setForm(prev => ({ ...prev, notes: t }))}
                placeholder="Optional"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Date Added:</Text>
              <DatePicker
                value={batchForm.dateAdded}
                onChange={(d) => setBatchForm(prev => ({ ...prev, dateAdded: d }))}
                label="Date Added"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAddSingle}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Add {filterType}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Batch Create Form Modal */}
      {showBatchForm && (
        <View style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Batch Create {filterType}s</Text>
              <TouchableOpacity onPress={() => setShowBatchForm(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Breed:</Text>
              <BreedPicker
                breeds={getBreedList()}
                value={batchForm.breed}
                onChange={(b) => setBatchForm(prev => ({ ...prev, breed: b }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Count:</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                value={batchForm.count}
                onChangeText={(t) => setBatchForm(prev => ({ ...prev, count: t }))}
                keyboardType="numeric"
                placeholder="How many?"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Date Added:</Text>
              <DatePicker
                value={batchForm.dateAdded}
                onChange={(d) => setBatchForm(prev => ({ ...prev, dateAdded: d }))}
                label="Date Added"
              />
            </View>

            {filterType === 'chicken' && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Gender:</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      { borderColor: colors.border },
                      batchForm.sex === 'M' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setBatchForm(prev => ({ ...prev, sex: 'M' }))}
                  >
                    <Text style={[styles.genderButtonText, { color: batchForm.sex === 'M' ? '#fff' : colors.text }]}>Roosters</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      { borderColor: colors.border },
                      batchForm.sex === 'F' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setBatchForm(prev => ({ ...prev, sex: 'F' }))}
                  >
                    <Text style={[styles.genderButtonText, { color: batchForm.sex === 'F' ? '#fff' : colors.text }]}>Hens</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleBatchCreate}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Create {batchForm.count || '0'} {filterType}s</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Death Event Dialog */}
      {showDeathDialog && selectedAnimalForDeath && (
        <View style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Record Death for {selectedAnimalForDeath.name || `#${selectedAnimalForDeath.number}`}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowDeathDialog(false);
                setSelectedAnimalForDeath(null);
              }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.deathDialogText, { color: colors.textSecondary }]}>
              How did this {filterType} die?
            </Text>

            <View style={styles.deathOptions}>
              <TouchableOpacity
                style={[styles.deathOptionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleDeathEvent('death')}
              >
                <Skull size={24} color={colors.textMuted} />
                <Text style={[styles.deathOptionText, { color: colors.text }]}>Died (Natural)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deathOptionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleDeathEvent('consumed')}
              >
                <Text style={{ fontSize: 24 }}>🍖</Text>
                <Text style={[styles.deathOptionText, { color: colors.text }]}>Consumed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filters: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 50,
  },
  typeButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
  animalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  animalCardInactive: {
    opacity: 0.5,
  },
  animalContent: {
    gap: 8,
    paddingRight: 70,
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  animalNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  animalName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  animalStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 0,
    marginLeft: 8,
  },
  animalBreed: {
    fontSize: 14,
  },
  animalNotes: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  animalDate: {
    fontSize: 12,
  },
  deathButton: {
    position: 'absolute',
    top: 0,
    right: 32,
    padding: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  editForm: {
    gap: 12,
  },
  editRow: {
    gap: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  editInputMulti: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  formInputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  migrateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  migrateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deathDialogText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  deathOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  deathOptionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  deathOptionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
