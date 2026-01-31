import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check } from "lucide-react-native";

interface BreedCount {
  breed: string;
  total: number;
  maleCount: string;
  femaleCount: string;
}

export default function MatureAnimalsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const { animals, matureAnimals } = useLivestock();
  
  // Parse animal IDs from params
  const animalIds = useMemo(() => {
    const ids = params.ids as string;
    return ids ? ids.split(',') : [];
  }, [params.ids]);

  const animalsToMature = useMemo(() => {
    return animals.filter(a => animalIds.includes(a.id));
  }, [animals, animalIds]);

  // Group animals by breed
  const breedGroups = useMemo(() => {
    const groups: { [breed: string]: typeof animalsToMature } = {};
    animalsToMature.forEach(animal => {
      const breed = animal.breed || 'Unknown';
      if (!groups[breed]) groups[breed] = [];
      groups[breed].push(animal);
    });
    return groups;
  }, [animalsToMature]);

  const animalType = animalsToMature[0]?.type || 'chicken';
  const totalCount = animalsToMature.length;

  // State for each breed's counts
  const [breedCounts, setBreedCounts] = useState<BreedCount[]>(() => {
    return Object.entries(breedGroups).map(([breed, animals]) => ({
      breed,
      total: animals.length,
      maleCount: '',
      femaleCount: '',
    }));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateBreedCount = (breed: string, field: 'maleCount' | 'femaleCount', value: string) => {
    setBreedCounts(prev => prev.map(bc => 
      bc.breed === breed ? { ...bc, [field]: value } : bc
    ));
  };

  // Calculate totals and validation
  const validation = useMemo(() => {
    let allValid = true;
    const errors: string[] = [];
    
    breedCounts.forEach(bc => {
      const male = parseInt(bc.maleCount, 10) || 0;
      const female = parseInt(bc.femaleCount, 10) || 0;
      const sum = male + female;
      
      if (sum > bc.total) {
        allValid = false;
        errors.push(`${bc.breed}: ${sum}/${bc.total} (too many)`);
      }
    });
    
    return { allValid, errors };
  }, [breedCounts]);

  const getSexLabels = () => {
    if (animalType === 'chicken') return { male: 'Roosters', female: 'Hens' };
    if (animalType === 'duck') return { male: 'Drakes', female: 'Hens' };
    if (animalType === 'rabbit') return { male: 'Bucks', female: 'Does' };
    return { male: 'Males', female: 'Females' };
  };

  const getStageLabel = () => {
    if (animalType === 'chicken') return 'Chicks';
    if (animalType === 'duck') return 'Ducklings';
    if (animalType === 'rabbit') return 'Kits';
    return 'Young';
  };

  const sexLabels = getSexLabels();
  const stageLabel = getStageLabel();

  const handleSubmit = async () => {
    if (!validation.allValid) {
      Alert.alert('Invalid Count', validation.errors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect all animal IDs across all breeds
      const allAnimalIds: string[] = [];
      let totalMales = 0;
      let totalFemales = 0;
      
      for (const bc of breedCounts) {
        const male = parseInt(bc.maleCount, 10) || 0;
        const female = parseInt(bc.femaleCount, 10) || 0;
        
        if (male + female === 0) continue;
        
        const breedAnimals = breedGroups[bc.breed].slice(0, male + female);
        allAnimalIds.push(...breedAnimals.map(a => a.id));
        
        totalMales += male;
        totalFemales += female;
      }
      
      // Process all animals in a single call
      if (allAnimalIds.length > 0) {
        await matureAnimals({
          animalIds: allAnimalIds,
          maleCount: totalMales,
          femaleCount: totalFemales,
        });
      }

      const totalMatured = breedCounts.reduce((sum, bc) => 
        sum + (parseInt(bc.maleCount, 10) || 0) + (parseInt(bc.femaleCount, 10) || 0), 
        0
      );

      Alert.alert('Success', `${totalMatured} ${stageLabel.toLowerCase()} converted to mature`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to mature animals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Mature {stageLabel}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Converting {totalCount} {stageLabel}</Text>
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            Specify how many are male and female for each breed (can convert partial amounts)
          </Text>
        </View>

        {breedCounts.map((bc) => {
          const male = parseInt(bc.maleCount, 10) || 0;
          const female = parseInt(bc.femaleCount, 10) || 0;
          const sum = male + female;
          const isOverLimit = sum > bc.total;
          
          return (
            <View key={bc.breed} style={[styles.breedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.breedTitle, { color: colors.text }]}>{bc.breed}</Text>
              <Text style={[styles.breedSubtext, { color: colors.textSecondary }]}>
                {bc.total} {stageLabel.toLowerCase()} available
              </Text>
              
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.text }]}>{sexLabels.male}:</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={bc.maleCount}
                  onChangeText={(val) => updateBreedCount(bc.breed, 'maleCount', val)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.text }]}>{sexLabels.female}:</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={bc.femaleCount}
                  onChangeText={(val) => updateBreedCount(bc.breed, 'femaleCount', val)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.breedTotal, { borderTopColor: colors.border }]}>
                <Text style={[styles.breedTotalLabel, { color: colors.text }]}>Total for breed:</Text>
                <Text style={[styles.breedTotalValue, { color: isOverLimit ? colors.error : colors.text }]}>
                  {sum} / {bc.total}
                </Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: validation.allValid && !isSubmitting ? colors.primary : colors.border }
          ]}
          onPress={handleSubmit}
          disabled={!validation.allValid || isSubmitting}
        >
          <Check size={20} color="#fff" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Processing...' : 'Convert to Mature'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
  },
  breedCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  breedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  breedSubtext: {
    fontSize: 14,
    marginBottom: 16,
  },
  breedTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  breedTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  breedTotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  form: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    width: 120,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
