import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check } from "lucide-react-native";

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

  const animalType = animalsToMature[0]?.type || 'chicken';
  const totalCount = animalsToMature.length;

  const [maleCount, setMaleCount] = useState('');
  const [femaleCount, setFemaleCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const male = parseInt(maleCount, 10) || 0;
    const female = parseInt(femaleCount, 10) || 0;

    if (male + female !== totalCount) {
      Alert.alert('Invalid Count', `Male + Female must equal ${totalCount}`);
      return;
    }

    if (male < 0 || female < 0) {
      Alert.alert('Invalid Count', 'Counts must be positive numbers');
      return;
    }

    setIsSubmitting(true);
    try {
      await matureAnimals({
        animalIds,
        maleCount: male,
        femaleCount: female,
      });

      Alert.alert('Success', `${totalCount} ${stageLabel.toLowerCase()} converted to mature`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to mature animals');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTotal = (parseInt(maleCount, 10) || 0) + (parseInt(femaleCount, 10) || 0);
  const isValid = currentTotal === totalCount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mature {stageLabel}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Converting {totalCount} {stageLabel}</Text>
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            Specify how many are male and female
          </Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>{sexLabels.male}:</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={maleCount}
              onChangeText={setMaleCount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>{sexLabels.female}:</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={femaleCount}
              onChangeText={setFemaleCount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
            <Text style={[styles.totalValue, { color: isValid ? colors.success : colors.error }]}>
              {currentTotal} / {totalCount}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isValid && !isSubmitting ? colors.primary : colors.border }
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          <Check size={20} color="#fff" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Processing...' : 'Convert to Mature'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
