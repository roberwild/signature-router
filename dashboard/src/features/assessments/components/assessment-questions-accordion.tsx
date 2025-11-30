'use client';

import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { FileText } from 'lucide-react';

interface QuestionItem {
  category: string;
  questionId: string;
  question: string;
  answer: string;
  score: number;
  subcategory?: string;
}

interface AssessmentQuestionsAccordionProps {
  questionsAndAnswers: QuestionItem[];
}

export function AssessmentQuestionsAccordion({ questionsAndAnswers }: AssessmentQuestionsAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const toggleAllItems = () => {
    if (isAllExpanded) {
      setExpandedItems([]);
      setIsAllExpanded(false);
    } else {
      const allItems = questionsAndAnswers.map((_, index) => `question-${index}`);
      setExpandedItems(allItems);
      setIsAllExpanded(true);
    }
  };

  const handleAccordionChange = (value: string[]) => {
    setExpandedItems(value);
    // Update isAllExpanded state based on whether all items are expanded
    setIsAllExpanded(value.length === questionsAndAnswers.length);
  };

  if (questionsAndAnswers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay datos detallados de preguntas disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllItems}
          className="gap-2"
        >
          {isAllExpanded ? (
            <>
              <Minimize2 className="h-4 w-4" />
              Contraer Todo
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              Expandir Todo
            </>
          )}
        </Button>
      </div>
      
      <Accordion 
        type="multiple" 
        value={expandedItems}
        onValueChange={handleAccordionChange}
        className="w-full"
      >
        {questionsAndAnswers.map((item, index) => (
          <AccordionItem key={index} value={`question-${index}`}>
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full mr-4">
                <span className="text-left">
                  {index + 1}. {item.question}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.score && (
                    <Badge 
                      className={
                        item.score === 4 ? 'bg-green-500 hover:bg-green-600 text-white' :
                        item.score === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                        item.score === 2 ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                        'bg-red-500 hover:bg-red-600 text-white'
                      }
                    >
                      {item.score}/4
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tu respuesta:</p>
                  <p className="text-sm mt-1 font-medium">{item.answer || 'Sin respuesta'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Puntuación:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative w-24">
                      <Progress 
                        value={(item.score / 4) * 100} 
                        className={`h-2 ${
                          item.score === 4 ? '[&>div]:bg-green-500' :
                          item.score === 3 ? '[&>div]:bg-yellow-500' :
                          item.score === 2 ? '[&>div]:bg-orange-500' :
                          '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      item.score === 4 ? 'text-green-600 dark:text-green-400' :
                      item.score === 3 ? 'text-yellow-600 dark:text-yellow-400' :
                      item.score === 2 ? 'text-orange-600 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {item.score} de 4 puntos
                    </span>
                  </div>
                </div>
                {item.score === 1 && (
                  <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-900 dark:text-red-200">
                      <strong>⚠️ Atención crítica:</strong> Esta área requiere implementación inmediata. 
                      Es fundamental establecer medidas básicas de seguridad lo antes posible.
                    </p>
                  </div>
                )}
                {item.score === 2 && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-900">
                    <p className="text-sm text-orange-900 dark:text-orange-200">
                      <strong>⚠️ Mejora necesaria:</strong> Existen implementaciones parciales pero insuficientes. 
                      Refuerce las medidas existentes y complete las áreas pendientes.
                    </p>
                  </div>
                )}
                {item.score === 3 && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <p className="text-sm text-yellow-900 dark:text-yellow-200">
                      <strong>💡 Buen progreso:</strong> Tiene una base sólida implementada. 
                      Considere optimizaciones adicionales para alcanzar el nivel óptimo.
                    </p>
                  </div>
                )}
                {item.score === 4 && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                    <p className="text-sm text-green-900 dark:text-green-200">
                      <strong>✅ Excelente:</strong> Esta área está completamente implementada. 
                      Mantenga las buenas prácticas y revise periódicamente.
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}