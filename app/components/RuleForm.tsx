import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Checkbox,
} from '@mui/material';
import { useRuleStore } from '../store/ruleStore';
import { Substance, Rule } from '../types/RuleTypes';

export default function RuleForm({ rule, open, onClose, onSave }: {
  rule: Rule | null;
  open: boolean;
  onClose: () => void;
  onSave: (newRule: Rule) => void;
}) {
  const { substances, substanceIdToNameMap } = useRuleStore(); // Fetch substances from Zustand
  const [ruleName, setRuleName] = useState(rule ? rule.name : '');
  const [masterSubstance, setMasterSubstance] = useState<Substance | null>(null);
  const [substitutes, setSubstitutes] = useState<Substance[]>([]);
  const [possibleSubstitutes, setPossibleSubstitutes] = useState<Substance[]>([]);
  const [ruleNameError, setRuleNameError] = useState(false);

  const addRule = useRuleStore((state) => state.addRule);
  const updateRule = useRuleStore((state) => state.updateRule);

  useEffect(() => {
    if (rule && Object.keys(substanceIdToNameMap).length > 0) {
      setRuleName(rule.name);

      // Find the group of the master substance (parent)
      const masterGroup = Object.keys(substances).find((group) =>
        substances[group].some((substance) => substance.code === rule.parentCode)
      );

      const master = {
        code: rule.parentCode,
        display: substanceIdToNameMap[rule.parentCode] || rule.parentCode,
        group: masterGroup || undefined,
      };
      setMasterSubstance(master);

      const possible = substances[master.group || ''] || [];
      setPossibleSubstitutes(possible);

      setSubstitutes(
        rule.substanceCodes.map((code) => ({
          code: code,
          display: substanceIdToNameMap[code] || code,
          group: masterGroup || '',
        }))
      );
    }
    else {
      // Reset form state for new rule creation
      setRuleName('');
      setMasterSubstance(null);
      setSubstitutes([]);
      setPossibleSubstitutes([]);
    }
  }, [open, rule, substanceIdToNameMap, substances]);

  // const handleMasterSubstanceChange = (event, newValue) => {
  //   console.log('setting master:', newValue);
  //   setMasterSubstance(newValue);
  //   if (newValue) {
  //     setPossibleSubstitutes(substances[newValue.group] || []);
  //   }
  // };

  const handleMasterSubstanceChange = (
    _: React.SyntheticEvent, // Remove `event` if unused, or type it properly
    newValue: Substance | null // Properly type `newValue`
  ) => {
    console.log('setting master:', newValue);
    setMasterSubstance(newValue);
    if (newValue) {
      setPossibleSubstitutes(substances[newValue.group || ''] || []); // Handle undefined group safely
    }
  };

  const handleSave = () => {
    if (!ruleName.trim()) {
      setRuleNameError(true);
      return;
    } else {
      setRuleNameError(false);
    }

    if (!masterSubstance) {
      alert('Please select a master substance.');
      return;
    }

    const newRule: Rule = {
      id: rule ? rule.id : Date.now(),
      name: ruleName.trim(),
      substanceCodes: substitutes.map((sub) => sub.code),
      parentCode: masterSubstance!.code,
    };

    if (rule) {
      updateRule(newRule); // If editing, update the rule
    } else {
      addRule(newRule); // If creating, add the rule
    }

    onSave(newRule);
    onClose(); // Close the modal after saving
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{rule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
      <DialogContent>
        <Typography variant="h6">Rule Name</Typography>
        <TextField
          label="Rule Name"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          fullWidth
          required
          error={ruleNameError}
          helperText={ruleNameError ? 'Rule name cannot be empty' : ''}
        />

        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Select Substance
        </Typography>
        <Autocomplete
          options={Object.keys(substances).flatMap((group) =>
            substances[group].map((substance) => ({
              group,
              display: substance.display,
              code: substance.code,
            }))
          )}
          groupBy={(option) => option.group || ''}
          getOptionLabel={(option) => option.display || ''}
          isOptionEqualToValue={(option, value) => option.code == value.code}
          renderInput={(params) => (
            <TextField {...params} label="Master Substance" variant="outlined" />
          )}
          onChange={handleMasterSubstanceChange}
          value={masterSubstance || null} // Ensure this is correctly set
        />

        {masterSubstance && (
          <>
            <Typography variant="h6" sx={{ marginTop: 2 }}>
              Select Substitutes substances for {masterSubstance?.display}
            </Typography>
            <Autocomplete
              multiple
              options={possibleSubstitutes}
              getOptionLabel={(option) => option.display || ''}
              isOptionEqualToValue={(option, value) => option.code === value.code}
              renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Checkbox
                      checked={substitutes.some((sub) => sub.code == option.code)}
                      style={{ marginRight: 8 }}
                    />
                    {option.display}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Possible Substitutes" variant="outlined" />
              )}
              onChange={(event, newValue) => {
                setSubstitutes(newValue);
              }}
              value={substitutes}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}