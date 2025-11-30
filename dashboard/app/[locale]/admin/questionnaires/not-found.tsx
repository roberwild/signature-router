import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { FileQuestion } from 'lucide-react';

export default function QuestionnairesNotFound() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The questionnaire page you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/admin/questionnaires">
            Back to Questionnaires
          </Link>
        </Button>
      </div>
    </div>
  );
}