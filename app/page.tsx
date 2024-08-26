import RuleList from './components/RuleList';
import { fetchAndGroupSubstances } from './services/fhirService';

export default async function RulesPage() {
  // Fetch data directly in the server component
  const groupedSubstances = await fetchAndGroupSubstances();
  console.log('Loaded:::', groupedSubstances);
  return (
    <div>
      <RuleList groupedSubstances={groupedSubstances} />
    </div>
  );
}