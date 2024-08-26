import { Substance, Rule } from './RuleTypes';

export type RuleStoreState = {
    substances: Record<string, Substance[]>;
    substanceIdToNameMap: Record<string, string>;
    addRule: (rule: Rule) => void;
    updateRule: (rule: Rule) => void;
};