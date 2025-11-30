'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  type UniqueIdentifier
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
  Plus,
  Edit2,
  Copy,
  Trash2,
  Settings,
  Pause,
  GripVertical,
  Save,
  X,
  Check,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Type,
  Hash,
  Mail,
  List,
  HelpCircle
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
} from '@workspace/ui/components/collapsible';
import type { QuestionnaireVersion, QuestionConfig, QuestionOption } from '~/data/admin/questionnaires/get-questionnaire-configs';

interface ImprovedQuestionnaireEditorProps {
  questionnaire: QuestionnaireVersion;
  isPreviewMode: boolean;
  onBack: () => void;
  onSave: (questionnaire: QuestionnaireVersion) => void;
  onAddQuestion: () => void;
  onEditQuestion: (question: QuestionConfig) => void;
  editingQuestion: QuestionConfig | null;
  onSaveQuestion: (question: QuestionConfig) => void;
  onCancelEdit: () => void;
}

export function ImprovedQuestionnaireEditor({
  questionnaire: initialQuestionnaire,
  isPreviewMode: _isPreviewMode,
  onBack,
  onSave,
  onAddQuestion,
  onEditQuestion,
  editingQuestion: _editingQuestion,
  onSaveQuestion: _onSaveQuestion,
  onCancelEdit: _onCancelEdit
}: ImprovedQuestionnaireEditorProps) {
  const [questionnaire, setQuestionnaire] = useState(initialQuestionnaire);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const _sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = questionnaire.questions.findIndex(q => q.id === active.id);
      const newIndex = questionnaire.questions.findIndex(q => q.id === over.id);
      
      const newQuestions = arrayMove(questionnaire.questions, oldIndex, newIndex) as QuestionConfig[];
      // Update order values
      newQuestions.forEach((q, i) => {
        q.order = i;
      });
      
      const updatedQuestionnaire = {
        ...questionnaire,
        questions: newQuestions
      };
      
      setQuestionnaire(updatedQuestionnaire);
      setHasChanges(true);
    }
    
    setActiveId(null);
  };

  const handleSaveChanges = () => {
    onSave(questionnaire);
    setHasChanges(false);
    toast.success('Questionnaire saved successfully');
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestionnaire = {
      ...questionnaire,
      questions: questionnaire.questions.filter(q => q.id !== questionId)
    };
    setQuestionnaire(updatedQuestionnaire);
    setHasChanges(true);
  };

  const handleDuplicateQuestion = (question: QuestionConfig) => {
    const newQuestion = {
      ...question,
      id: `question-${Date.now()}`,
      question: `${question.question} (Copy)`,
      order: questionnaire.questions.length
    };
    
    const updatedQuestionnaire = {
      ...questionnaire,
      questions: [...questionnaire.questions, newQuestion]
    };
    
    setQuestionnaire(updatedQuestionnaire);
    setHasChanges(true);
  };

  const handleQuickEdit = (questionId: string, field: keyof QuestionConfig, value: unknown) => {
    const updatedQuestions = questionnaire.questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    
    const updatedQuestionnaire = {
      ...questionnaire,
      questions: updatedQuestions
    };
    
    setQuestionnaire(updatedQuestionnaire);
    setHasChanges(true);
  };

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const activeQuestion = activeId ? questionnaire.questions.find(q => q.id === activeId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{questionnaire.name}</h2>
              <p className="text-muted-foreground">{questionnaire.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-600/20">
                <AlertCircle className="mr-1 h-3 w-3" />
                Unsaved changes
              </Badge>
            )}
            <Badge variant="outline">v{questionnaire.version}</Badge>
            <Badge variant={questionnaire.isActive ? "default" : "secondary"}>
              {questionnaire.isActive ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-3 w-3" />
                  Draft
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {questionnaire.questions.length} questions
            </span>
            <Badge variant="outline">{questionnaire.type}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuestionnaire(initialQuestionnaire);
                    setHasChanges(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            )}
            <Button onClick={onAddQuestion} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <DndContext
        sensors={_sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questionnaire.questions.map(q => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {questionnaire.questions.map((question) => (
              <SortableQuestionCard
                key={question.id}
                question={question}
                index={questionnaire.questions.indexOf(question)}
                isExpanded={expandedQuestions.has(question.id)}
                onToggleExpanded={() => toggleExpanded(question.id)}
                onQuickEdit={(field, value) => handleQuickEdit(question.id, field, value)}
                onEdit={() => onEditQuestion(question)}
                onDelete={() => handleDeleteQuestion(question.id)}
                onDuplicate={() => handleDuplicateQuestion(question)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && activeQuestion ? (
            <DragOverlayCard question={activeQuestion} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {questionnaire.questions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 mb-3 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No questions yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your questionnaire by adding questions
            </p>
            <Button onClick={onAddQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SortableQuestionCardProps {
  question: QuestionConfig;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onQuickEdit: (field: keyof QuestionConfig, value: unknown) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableQuestionCard({
  question,
  index,
  isExpanded,
  onToggleExpanded,
  onQuickEdit,
  onEdit,
  onDelete,
  onDuplicate
}: SortableQuestionCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(question.question);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    onQuickEdit('question', editedTitle);
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(question.question);
    setIsEditingTitle(false);
  };

  const getQuestionIcon = (type: string) => {
    switch(type) {
      case 'text':
      case 'text_area':
        return <Type className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'single_choice':
      case 'multiple_choice':
        return <List className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch(type) {
      case 'text': return 'Short Text';
      case 'text_area': return 'Long Text';
      case 'single_choice': return 'Single Choice';
      case 'multiple_choice': return 'Multiple Choice';
      case 'email': return 'Email';
      case 'number': return 'Number';
      default: return type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "opacity-50"
      )}
    >
      <Card className={cn(
        "transition-all duration-200",
        "hover:shadow-md",
        isDragging && "shadow-2xl rotate-2"
      )}>
        <div className="flex items-start">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-4 cursor-move hover:bg-accent rounded-l-lg transition-colors"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {index + 1}
                </div>
                
                {/* Question Text - Inline Editable */}
                <div className="flex-1">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={titleInputRef}
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-1"
                      />
                      <Button size="sm" variant="ghost" onClick={handleSaveTitle}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="group/title flex items-center gap-2 cursor-pointer"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      <h4 className="text-sm font-medium">{question.question}</h4>
                      <Edit2 className="h-3 w-3 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1">
                          {getQuestionIcon(question.type)}
                          {getQuestionTypeLabel(question.type)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Question Type</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {question.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  
                  {question.category && (
                    <Badge variant="secondary" className="text-xs">
                      {question.category}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleExpanded}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isExpanded ? 'Collapse' : 'Expand'} details
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEdit}>
                      <Settings className="mr-2 h-4 w-4" />
                      Advanced Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Quick Settings - Expandable */}
            <Collapsible open={isExpanded}>
              <CollapsibleContent className="space-y-3 pt-3 border-t">
                {/* Required Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`required-${question.id}`} className="text-sm cursor-pointer">
                    Required Field
                  </Label>
                  <Switch
                    id={`required-${question.id}`}
                    checked={question.required}
                    onCheckedChange={(checked) => onQuickEdit('required', checked)}
                  />
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Category</Label>
                  <Input
                    value={question.category || ''}
                    onChange={(e) => onQuickEdit('category', e.target.value)}
                    placeholder="Enter category"
                    className="w-48 h-8"
                  />
                </div>

                {/* Options Editor for Choice Questions */}
                {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                  <InlineOptionsEditor
                    question={question}
                    onQuickEdit={onQuickEdit}
                  />
                )}

                {/* Placeholder for text inputs */}
                {(question.type === 'text' || question.type === 'text_area' || question.type === 'email') && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Placeholder</Label>
                    <Input
                      value={question.placeholder || ''}
                      onChange={(e) => onQuickEdit('placeholder', e.target.value)}
                      placeholder="Enter placeholder text"
                      className="w-64 h-8"
                    />
                  </div>
                )}

                {/* Text field settings */}
                {question.type === 'text' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Min Length</Label>
                      <Input
                        type="number"
                        value={question.minLength || ''}
                        onChange={(e) => onQuickEdit('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="0"
                        className="w-20 h-8"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Length</Label>
                      <Input
                        type="number"
                        value={question.maxLength || ''}
                        onChange={(e) => onQuickEdit('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="∞"
                        className="w-20 h-8"
                      />
                    </div>
                  </div>
                )}

                {/* Full Edit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Open Advanced Editor
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DragOverlayCard({ question }: { question: QuestionConfig }) {
  return (
    <Card className="shadow-2xl rotate-2 opacity-90">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <h4 className="text-sm font-medium">{question.question}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {question.type}
              </Badge>
              {question.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline Options Editor Component
interface InlineOptionsEditorProps {
  question: QuestionConfig;
  onQuickEdit: (field: keyof QuestionConfig, value: unknown) => void;
}

function InlineOptionsEditor({ question, onQuickEdit }: InlineOptionsEditorProps) {
  const [options, setOptions] = useState<(string | QuestionOption)[]>(question.options || []);
  const [newOptionText, setNewOptionText] = useState('');
  // const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);
  

  useEffect(() => {
    setOptions(question.options || []);
  }, [question.options]);

  const handleOptionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedOptionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleOptionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleOptionDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedOptionIndex === null) return;
    
    const draggedOption = options[draggedOptionIndex];
    const newOptions = [...options];
    
    // Remove from old position
    newOptions.splice(draggedOptionIndex, 1);
    // Insert at new position
    newOptions.splice(dropIndex, 0, draggedOption);
    
    setOptions(newOptions);
    onQuickEdit('options', newOptions);
    setDraggedOptionIndex(null);
  };

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    
    const newOption = {
      value: newOptionText,
      label: newOptionText,
      score: 0,
      service: ''
    };
    
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    onQuickEdit('options', newOptions);
    setNewOptionText('');
  };

  const handleUpdateOption = (index: number, field: string, value: unknown) => {
    const newOptions = [...options];
    const option = newOptions[index];

    if (typeof option === 'string') {
      // Convert string to object format
      const newOption: QuestionOption = {
        value: field === 'label' ? String(value) : option,
        label: field === 'label' ? String(value) : option,
        score: field === 'score' ? Number(value) : 0,
        service: field === 'service' ? String(value) : ''
      };
      newOptions[index] = newOption;
    } else if (typeof option === 'object' && option !== null) {
      // Update existing object
      const existingOption = option as QuestionOption;
      const updatedOption: QuestionOption = {
        ...existingOption,
        [field]: value,
        value: field === 'label' ? String(value) : existingOption.value
      };
      newOptions[index] = updatedOption;
    }

    setOptions(newOptions);
    onQuickEdit('options', newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onQuickEdit('options', newOptions);
  };

  const normalizeOption = (option: string | QuestionOption): QuestionOption => {
    if (typeof option === 'string') {
      return { value: option, label: option, score: 0, service: '' };
    }
    return option;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Options ({options.length})
        </Label>
        {question.allow_other && (
          <Badge variant="outline" className="text-xs">
            <Check className="mr-1 h-3 w-3" />
            "Other" option enabled
          </Badge>
        )}
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionObj = normalizeOption(option);
          // const isEditing = activeOptionId === `${question.id}-${index}`; // Future: inline editing
          
          return (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleOptionDragStart(e, index)}
              onDragOver={handleOptionDragOver}
              onDrop={(e) => handleOptionDrop(e, index)}
              className={cn(
                "group flex items-start gap-2 p-2 rounded-lg border bg-card/50 transition-all",
                draggedOptionIndex === index && "opacity-50",
                "hover:bg-accent/50"
              )}
            >
              {/* Drag Handle */}
              <div className="pt-2 cursor-move opacity-50 hover:opacity-100">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Option Content */}
              <div className="flex-1 space-y-2">
                {/* Option Label */}
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </div>
                  <Input
                    value={optionObj.label}
                    onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                    placeholder="Option text"
                    className="flex-1 h-8"
                  />
                </div>

                {/* Score and Service */}
                <div className="grid grid-cols-2 gap-2 pl-8">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Score:</Label>
                    <Input
                      type="number"
                      value={optionObj.score || 0}
                      onChange={(e) => handleUpdateOption(index, 'score', parseInt(e.target.value) || 0)}
                      className="h-7 text-xs"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Service:</Label>
                    <Input
                      value={optionObj.service || ''}
                      onChange={(e) => handleUpdateOption(index, 'service', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(index)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add New Option */}
      <div className="flex gap-2">
        <Input
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          placeholder="Type new option text..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddOption();
            }
          }}
          className="flex-1 h-8"
        />
        <Button
          size="sm"
          onClick={handleAddOption}
          disabled={!newOptionText.trim()}
          className="h-8"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Allow Other Option Toggle */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="space-y-0.5">
          <Label htmlFor={`allow-other-${question.id}`} className="text-sm cursor-pointer">
            Allow "Other" Option
          </Label>
          <p className="text-xs text-muted-foreground">
            Add a text field for custom answers
          </p>
        </div>
        <Switch
          id={`allow-other-${question.id}`}
          checked={question.allow_other || false}
          onCheckedChange={(checked) => onQuickEdit('allow_other', checked)}
        />
      </div>
    </div>
  );
}