import { create } from 'zustand';
import { fetchAndGroupSubstances } from '../services/fhirService';

interface Rule {
  id: number;
  name: string;
  substanceCodes: string[];
  parentCode: string;
}

interface RuleStore {
  rules: Rule[];
  substances: { [group: string]: { code: string; display: string }[] };
  substanceIdToNameMap: { [id: string]: string };
  substancesLoaded: boolean;
  setRules: (rules: Rule[]) => void;
  updateRule: (updatedRule: Rule) => void;
  addRule: (rule: Rule) => void;
  setSubstances: (substances: { [group: string]: { code: string; display: string }[] }) => void;
  setSubstanceIdToNameMap: (map: { [id: string]: string }) => void;
  fetchSubstances: () => Promise<void>; // Add fetchSubstances to the store interface
}

export const useRuleStore = create<RuleStore>((set) => ({
  rules: [],
  substances: {},
  substanceIdToNameMap: {},
  substancesLoaded: false,
  setRules: (rules) => set({ rules }),
  addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
  updateRule: (updatedRule) =>
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.id === updatedRule.id ? updatedRule : rule
      ),
    })),

  setSubstances: (substances) => set({ substances }),
  setSubstanceIdToNameMap: (map) => set({ substanceIdToNameMap: map }),

  fetchSubstances: async () => {
    try {
      const substances = await fetchAndGroupSubstances(); // Fetch grouped substances from FHIR service
      // const substanceIdToNameMap = Object.keys(substances).reduce((map, group) => {
      //   substances[group].forEach((substance) => {
      //     map[substance.code] = substance.display;
      //   });
      //   return map;
      // }, {});

      const substanceIdToNameMap: { [id: string]: string } = Object.keys(substances).reduce((map, group) => {
        substances[group].forEach((substance) => {
          map[substance.code] = substance.display;
        });
        return map;
      }, {} as { [id: string]: string }); // Explicitly typing the accumulator

      set({ substances, substanceIdToNameMap }); // Update Zustand's state with the fetched data
    } catch (error) {
      console.error('Error fetching substances:', error);
    }
  },
}));