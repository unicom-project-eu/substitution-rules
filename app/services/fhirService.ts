import axios from "axios";

interface GroupedSubstances {
  [group: string]: { code: string; display: string }[];
}

export async function fetchAndGroupSubstances(): Promise<GroupedSubstances> {
  try {
    const response = await axios.get("https://jpa.unicom.datawizard.it/fhir/CodeSystem/substance-sms-cs");
    const concepts = response.data.concept || [];
    console.log('loading subs!!');
    const groupedSubstances: { [group: string]: { code: string, display: string }[] } = {};

    concepts.forEach((concept: { code: string; display: string }) => {
      // Apply camel case formatting to display name
      const camelCaseDisplay = toCamelCase(concept.display);
      const baseName = getBaseName(camelCaseDisplay);

      if (!groupedSubstances[baseName]) {
        groupedSubstances[baseName] = [];
      }
      groupedSubstances[baseName].push({ code: concept.code, display: camelCaseDisplay });
    });
    console.log('loaded... ', groupedSubstances);
    return groupedSubstances;
  } catch (error) {
    console.error("Error fetching CodeSystem:", error);
    return {};
  }
}

// Helper function to format display names to camel case
function toCamelCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Helper function to extract the base name for grouping (e.g., first few characters)
function getBaseName(displayName: string) {
  // Grouping by the first word, assuming that base names are the first word (e.g., "Amlodipine")
  const baseName = displayName.split(" ")[0].toLowerCase();
  return baseName;
}
