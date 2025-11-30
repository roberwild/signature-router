/**
 * Test component to verify dynamic question counts are working in frontend
 */
import { useSurveyQuestions } from '~/src/features/assessments/hooks/use-survey-questions';

export function TestDynamicFrontend() {
  const { 
    questions, 
    loading, 
    error, 
    totalQuestions, 
    categoryCounts 
  } = useSurveyQuestions();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Dynamic Question Counts Test</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">API Response Counts:</h3>
        <ul className="list-disc pl-5">
          <li>Total Questions: {totalQuestions}</li>
          <li>Personas: {categoryCounts.personas}</li>
          <li>Procesos: {categoryCounts.procesos}</li>
          <li>Tecnologías: {categoryCounts.tecnologias}</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Actual Loaded Questions:</h3>
        <ul className="list-disc pl-5">
          <li>Personas: {questions?.personas?.length || 0} questions</li>
          <li>Procesos: {questions?.procesos?.length || 0} questions</li>
          <li>Tecnologías: {questions?.tecnologias?.length || 0} questions</li>
          <li>Metadata: {questions?.metadata?.length || 0} questions</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Total for Progress Calculation:</h3>
        <p className="font-mono">
          {categoryCounts.personas} + {categoryCounts.procesos} + {categoryCounts.tecnologias} = {' '}
          {categoryCounts.personas + categoryCounts.procesos + categoryCounts.tecnologias} questions
        </p>
      </div>
    </div>
  );
}