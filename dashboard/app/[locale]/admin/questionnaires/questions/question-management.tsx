'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  GripVertical,
  Search,
  Filter,
  AlertCircle,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { SortableQuestionItem } from './sortable-question-item';
import { QuestionFlowPreview } from '~/components/admin/questionnaires/question-flow-preview';
import type { QuestionConfig } from '~/data/admin/questionnaires/get-question-configs';

interface QuestionManagementProps {
  initialQuestions: QuestionConfig[];
  locale: string;
}

type FilterCategory = 'all' | 'A1' | 'B1' | 'C1' | 'D1' | 'none';
type SortBy = 'priority' | 'order' | 'name';

export function QuestionManagement({ initialQuestions, locale: _locale }: QuestionManagementProps) {
  const [questions, setQuestions] = useState<QuestionConfig[]>(initialQuestions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortBy>('order');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.questionId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      if (filterCategory === 'none') {
        filtered = filtered.filter(q => !q.category);
      } else {
        filtered = filtered.filter(q => q.category === filterCategory);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'priority':
        filtered.sort((a, b) => b.priority - a.priority);
        break;
      case 'order':
        filtered.sort((a, b) => a.orderIndex - b.orderIndex);
        break;
      case 'name':
        filtered.sort((a, b) => a.questionText.localeCompare(b.questionText));
        break;
    }

    return filtered;
  }, [questions, searchQuery, filterCategory, sortBy]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = filteredQuestions.findIndex(q => q.id === active.id);
      const newIndex = filteredQuestions.findIndex(q => q.id === over.id);
      
      const newQuestions = arrayMove(filteredQuestions, oldIndex, newIndex);
      
      // Update order indices
      const updatedQuestions = newQuestions.map((q, index) => ({
        ...q,
        orderIndex: index
      }));
      
      setQuestions(prev => {
        // Merge the reordered filtered questions back into the full list
        const questionMap = new Map(updatedQuestions.map(q => [q.id, q]));
        return prev.map(q => questionMap.get(q.id) || q);
      });
      
      setHasChanges(true);
    }
    
    setActiveId(null);
  };

  const handlePriorityChange = (questionId: string, priority: number) => {
    setQuestions(prev => prev.map(q =>
      q.questionId === questionId ? { ...q, priority } : q
    ));
    setHasChanges(true);
  };

  const handleToggleCritical = (questionId: string) => {
    setQuestions(prev => prev.map(q =>
      q.questionId === questionId ? { ...q, isCritical: !q.isCritical } : q
    ));
    setHasChanges(true);
  };

  const handleToggleEnabled = (questionId: string) => {
    setQuestions(prev => prev.map(q =>
      q.questionId === questionId ? { ...q, enabled: !q.enabled } : q
    ));
    setHasChanges(true);
  };

  const handleBulkPriorityUpdate = (priority: number) => {
    const selectedQuestions = filteredQuestions.filter(q => q.isCritical);
    if (selectedQuestions.length === 0) {
      toast.error('No critical questions selected');
      return;
    }

    setQuestions(prev => prev.map(q =>
      selectedQuestions.some(sq => sq.id === q.id) ? { ...q, priority } : q
    ));
    setHasChanges(true);
    toast.success(`Updated priority for ${selectedQuestions.length} questions`);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save priority and order changes
      const updates = questions.map(q => ({
        questionId: q.questionId,
        priority: q.priority,
        orderIndex: q.orderIndex,
        isCritical: q.isCritical,
        enabled: q.enabled
      }));

      const response = await fetch('/api/admin/questionnaires/questions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) throw new Error('Failed to save');

      setHasChanges(false);
      toast.success('Questions updated successfully');
    } catch (error) {
      toast.error('Failed to save question changes');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const activeQuestion = activeId ? questions.find(q => q.id === activeId) : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as FilterCategory)}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="D1">D1</SelectItem>
                  <SelectItem value="none">General</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <QuestionFlowPreview 
                questions={questions} 
                category={filterCategory === 'all' ? 'A1' : filterCategory === 'none' ? undefined : filterCategory}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkPriorityUpdate(90)}
              >
                Set Critical Priority
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                size="sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.filter(q => q.isCritical).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.filter(q => q.enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filtered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredQuestions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            Drag and drop to reorder. Critical questions are prioritized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={filteredQuestions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {filteredQuestions.map((question) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    onPriorityChange={handlePriorityChange}
                    onToggleCritical={handleToggleCritical}
                    onToggleEnabled={handleToggleEnabled}
                  />
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeQuestion && (
                <div className="rounded-lg border bg-card p-4 shadow-lg">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{activeQuestion.questionText}</span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {filteredQuestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="mb-3 h-8 w-8" />
              <p>No questions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}