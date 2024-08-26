"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  CircularProgress,
  Toolbar,
  Box,
  IconButton, // For table header button
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material"; // Icon for add rule
import RuleForm from "./RuleForm";
import { useRuleStore } from "../store/ruleStore";
import { read, utils, writeFileXLSX, WorkBook } from "xlsx";
import { Substance, Rule } from '../types/RuleTypes';

interface RuleListProps {
  groupedSubstances: { [group: string]: { code: string; display: string }[] };
}

export default function RuleList({ groupedSubstances }: RuleListProps) {
  const { rules, setRules, setSubstances, substanceIdToNameMap } = useRuleStore();
  const [selectedRule, setSelectedRule] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [workbook, setWorkbook] = useState<WorkBook | null>(null); // Store the workbook in memory
  const [headers, setHeaders] = useState<string[][]>([]); // Store headers for saving
  const [ruleSource, setRuleSource] = useState("scratch"); // Track rule source

  // useEffect(() => {
  //   const loadSubstances = async () => {
  //     if (!substancesLoaded) {
  //       setLoading(true);
  //       await fetchSubstances();
  //       setLoading(false);
  //     } else {
  //       setLoading(false);
  //     }
  //   };

  //   loadSubstances();
  // }, [fetchSubstances, substancesLoaded]);

  useEffect(() => {
    setSubstances(groupedSubstances);
    console.log('setting substances!!!');
  }, [groupedSubstances, setSubstances]);

  // Handle creating a new rule
  const handleCreateNewRule = () => {
    setSelectedRule(null);
    setIsFormOpen(true);
  };

  // Handle editing an existing rule
  const handleEditRule = (rule: any) => {
    setSelectedRule(rule);
    setIsFormOpen(true);
  };

  // Handle closing the form modal
  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  // Handle loading rules from Excel
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      // Handle the case where no files were selected
      console.warn("No file selected");
      return;
    }

    const file = event.target.files[0];
    setFileName(file.name);
    setRuleSource("user-file");
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e?.target?.result;
      const wb = read(binaryStr, { type: "binary" });
      setWorkbook(wb); // Store the workbook in memory

      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];

      // const sheetData = utils.sheet_to_json(sheet, { header: 1 });

      // const fileHeaders = sheetData.slice(0, 9);
      const sheetData = utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]; // Casting the sheet data as a 2D array of unknowns

      // Extract headers (first 9 rows) and cast them as string[][]
      const fileHeaders = sheetData.slice(0, 9) as string[][];
      setHeaders(fileHeaders);

      // Skip the first 9 rows and process the data
      const ruleData = sheetData.slice(9);
      const parsedRules = ruleData
        .filter((row): row is string[] => Array.isArray(row) && row.length > 0 && typeof row[0] === 'string') // Type guard
        .map((row, index) => {
          let substanceCodes: string[] = [];

          if (row[2]) {
            substanceCodes = row[2]
              .split(/,\s*|\s+/) // Split by commas or spaces
              .map((code) => code.trim().replace(/\"/g, "")) // Trim and remove quotes
              .filter((code) => code !== ""); // Filter out empty strings
          }

          return {
            id: index + 1,
            name: row[0], // Column A (Rule Name)
            substanceCodes: substanceCodes, // Parsed substance codes from column C
            parentCode: row[4] ? row[4].replace(/\"/g, "") : "", // Column E (Parent Code)
          };
        });

      setRules(parsedRules); // Update Zustand store with the parsed rules
    };

    reader.readAsBinaryString(file);
  };

  const loadSampleFile = async () => {
    try {
      setRuleSource("sample");
      // Fetch the sample Excel file from the public directory
      const response = await fetch("/sample_rules.xlsx");
      const arrayBuffer = await response.arrayBuffer();

      // Read the Excel file using xlsx
      const workbook = read(new Uint8Array(arrayBuffer), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const sheetData = utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]; // Casting the sheet data as a 2D array of unknowns

      const sampleHeaders = sheetData.slice(0, 9) as string[][];
      // const sampleHeaders = sheetData.slice(0, 9);
      setHeaders(sampleHeaders);

      // Skip the first 9 rows and process the data
      const ruleData = sheetData.slice(9);
      const parsedRules = ruleData
        .filter((row): row is string[] => Array.isArray(row) && row.length > 0 && typeof row[0] === 'string') // Type guard
        .map((row, index) => {
          let substanceCodes: string[] = [];

          if (row[2]) {
            substanceCodes = row[2]
              .split(/,\s*|\s+/)
              .map((code) => code.trim().replace(/\"/g, ""))
              .filter((code) => code !== "");
          }

          return {
            id: index + 1,
            name: row[0], // Column A (Rule Name)
            substanceCodes: substanceCodes, // Parsed substance codes from column C
            parentCode: row[4] ? row[4].replace(/\"/g, "") : "", // Column E (Parent Code)
          };
        });

      setWorkbook(workbook); // Store the workbook
      setRules(parsedRules); // Update state with parsed rules
    } catch (error) {
      console.error("Error loading sample file:", error);
    }
  };

  const handleSaveFile = () => {
    let wbToSave = workbook; // Default to the current workbook
    let sheetName, sheet;

    // If no workbook exists, create a new one
    if (!workbook) {
      wbToSave = utils.book_new();
      sheetName = "Sheet1";
      sheet = utils.aoa_to_sheet(headers); // Start with the headers from the sample
      utils.book_append_sheet(wbToSave, sheet, sheetName);
    } else {
      sheetName = wbToSave!.SheetNames[0];
      sheet = wbToSave!.Sheets[sheetName];
    }

    // Prepare the updated rule data to append
    const updatedRulesData = rules.map((rule, index) => {
      return [
        { v: rule.name, s: sheet[`A${index + 10}`]?.s || {} }, // Rule Name (preserving styles)
        { v: "", s: sheet[`B${index + 10}`]?.s || {} }, // Column B
        {
          v: rule.substanceCodes.map((code) => `"${code}"`).join(", "),
          s: sheet[`C${index + 10}`]?.s || {},
        }, // Substitute Codes
        { v: "", s: sheet[`D${index + 10}`]?.s || {} }, // Column D
        { v: `"${rule.parentCode}"`, s: sheet[`E${index + 10}`]?.s || {} }, // Parent Code
      ];
    });

    // Apply the updated rules to the sheet, preserving formatting
    updatedRulesData.forEach((row, index) => {
      row.forEach((cell, colIndex) => {
        const cellRef = utils.encode_cell({ r: index + 9, c: colIndex }); // Calculate cell reference
        sheet[cellRef] = cell; // Update the cell value and style
      });
    });

    // Save the workbook with the updated sheet
    writeFileXLSX(wbToSave!, fileName || "Updated_Substance_Groups.xlsx");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <CircularProgress />
        <Typography>Loading substances...</Typography>
      </div>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Rules List
      </Typography>

      <Toolbar sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Button variant="contained" color="primary" onClick={loadSampleFile}>
            Load Sample Rules
          </Button>
          {fileName || ruleSource === "sample" ? (
            <Button variant="contained" color="secondary" sx={{ ml: 2 }} onClick={handleSaveFile}>
              Save Rules to Excel
            </Button>
          ) : (
            <Button variant="contained" color="secondary" component="label" sx={{ ml: 2 }}>
              Load Rules from Excel
              <input type="file" hidden onChange={handleFileUpload} accept=".xlsx, .xls" />
            </Button>
          )}
        </Box>
        <IconButton color="primary" onClick={handleCreateNewRule} title="Add New Rule">
          <AddIcon />
        </IconButton>
      </Toolbar>

      {fileName && (
        <Typography variant="caption" sx={{ mb: 2, display: "block" }}>
          Loaded file: {fileName}
        </Typography>
      )}

      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rule Name</TableCell>
              <TableCell>Substitute Names</TableCell>
              <TableCell>Parent Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>
                  {rule.substanceCodes
                    .map((code) => substanceIdToNameMap[code] || code)
                    .join(", ")}
                </TableCell>
                <TableCell>
                  {substanceIdToNameMap[rule.parentCode] || rule.parentCode}
                </TableCell>
                <TableCell align="right">
                  <Button variant="outlined" onClick={() => handleEditRule(rule)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for creating/editing rules */}
      <RuleForm
        rule={selectedRule} // Pass selected rule for editing, or null for new rule
        open={isFormOpen} // Open the modal
        onClose={handleCloseForm} // Close the modal
        onSave={handleCloseForm} // Handle form save
      />
    </div>
  );
}