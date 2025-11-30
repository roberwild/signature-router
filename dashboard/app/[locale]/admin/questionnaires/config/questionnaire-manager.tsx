'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { ImprovedQuestionnaireEditor } from './questionnaire-editor-improved';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { 
  Plus,
  Edit,
  Copy,
  Eye,
  Play,
  Pause,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Users,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import type { QuestionnaireConfigData, QuestionnaireVersion, QuestionConfig } from '~/data/admin/questionnaires/get-questionnaire-configs';

interface QuestionnaireManagerProps {
  initialData: QuestionnaireConfigData;
}

export function QuestionnaireManager({ initialData }: QuestionnaireManagerProps) {
  const [data, setData] = useState(initialData);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireVersion | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState<QuestionConfig | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="border-green-600/50 text-green-600">
        <CheckCircle className="mr-1 h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        <Pause className="mr-1 h-3 w-3" />
        Draft
      </Badge>
    );
  };

  const handleEditQuestionnaire = (questionnaire: QuestionnaireVersion) => {
    setSelectedQuestionnaire(questionnaire);
  };

  const handlePreviewQuestionnaire = (questionnaire: QuestionnaireVersion) => {
    setSelectedQuestionnaire(questionnaire);
    setIsPreviewMode(true);
  };

  const handleToggleActive = async (questionnaireId: string, currentStatus: boolean) => {
    const questionnaire = [...data.onboardingQuestionnaires, ...data.followUpQuestionnaires]
      .find(q => q.id === questionnaireId);
    
    if (!questionnaire) return;

    // Check if it's an onboarding questionnaire
    const isOnboarding = data.onboardingQuestionnaires.some(q => q.id === questionnaireId);
    
    if (isOnboarding) {
      if (!currentStatus) {
        // Activating an onboarding questionnaire
        const hasActiveOnboarding = data.onboardingQuestionnaires.some(q => q.isActive && q.id !== questionnaireId);
        if (hasActiveOnboarding) {
          setPendingActivationId(questionnaireId);
          setShowActivationModal(true);
          return;
        }
      } else {
        // Deactivating the onboarding questionnaire
        setPendingActivationId(questionnaireId);
        setShowDeactivationModal(true);
        return;
      }
    }

    // For non-onboarding or when no conflict, proceed with toggle
    await performToggle(questionnaireId, !currentStatus);
  };

  const performToggle = async (questionnaireId: string, newStatus: boolean) => {
    try {
      // API call to toggle status
      // await updateQuestionnaireStatus(questionnaireId, newStatus);
      
      // If activating an onboarding questionnaire, deactivate others
      if (newStatus && data.onboardingQuestionnaires.some(q => q.id === questionnaireId)) {
        setData(prev => ({
          ...prev,
          onboardingQuestionnaires: prev.onboardingQuestionnaires.map(q => 
            q.id === questionnaireId ? { ...q, isActive: true } : { ...q, isActive: false }
          ),
        }));
      } else {
        // Update local state normally
        setData(prev => ({
          ...prev,
          onboardingQuestionnaires: prev.onboardingQuestionnaires.map(q => 
            q.id === questionnaireId ? { ...q, isActive: newStatus } : q
          ),
          followUpQuestionnaires: prev.followUpQuestionnaires.map(q => 
            q.id === questionnaireId ? { ...q, isActive: newStatus } : q
          )
        }));
      }

      toast.success(`Questionnaire ${newStatus ? 'activated' : 'deactivated'}`);
      setShowActivationModal(false);
      setShowDeactivationModal(false);
      setPendingActivationId(null);
    } catch (_error) {
      toast.error('Failed to update questionnaire status');
    }
  };

  const handleDuplicateQuestionnaire = async (questionnaireId: string) => {
    const questionnaire = [...data.onboardingQuestionnaires, ...data.followUpQuestionnaires]
      .find(q => q.id === questionnaireId);
    
    if (!questionnaire) return;

    const duplicatedQuestionnaire: QuestionnaireVersion = {
      ...questionnaire,
      id: `questionnaire-${Date.now()}`,
      name: `${questionnaire.name} (Copy)`,
      version: 1,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: questionnaire.questions.map(q => ({
        ...q,
        id: `question-${Date.now()}-${Math.random()}`
      }))
    };

    try {
      // API call to create duplicate
      // await createQuestionnaire(duplicatedQuestionnaire);
      
      // Update local state
      const isOnboarding = data.onboardingQuestionnaires.some(q => q.id === questionnaireId);
      
      if (isOnboarding) {
        setData(prev => ({
          ...prev,
          onboardingQuestionnaires: [...prev.onboardingQuestionnaires, duplicatedQuestionnaire]
        }));
      } else {
        setData(prev => ({
          ...prev,
          followUpQuestionnaires: [...prev.followUpQuestionnaires, duplicatedQuestionnaire]
        }));
      }

      toast.success('Questionnaire duplicated successfully');
    } catch (_error) {
      toast.error('Failed to duplicate questionnaire');
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: QuestionConfig = {
      id: `question-${Date.now()}`,
      type: 'text',
      question: 'New Question',
      required: false,
      category: 'General',
      order: selectedQuestionnaire?.questions.length || 0
    };
    setIsEditingQuestion(newQuestion);
  };

  const handleEditQuestion = (question: QuestionConfig) => {
    setIsEditingQuestion(question);
  };

  const handleSaveQuestion = (question: QuestionConfig) => {
    if (!selectedQuestionnaire) return;

    const updatedQuestions = selectedQuestionnaire.questions.some(q => q.id === question.id)
      ? selectedQuestionnaire.questions.map(q => q.id === question.id ? question : q)
      : [...selectedQuestionnaire.questions, question];

    const updatedQuestionnaire = {
      ...selectedQuestionnaire,
      questions: updatedQuestions.sort((a, b) => a.order - b.order)
    };

    setSelectedQuestionnaire(updatedQuestionnaire);
    
    // Update in main data
    setData(prev => ({
      ...prev,
      onboardingQuestionnaires: prev.onboardingQuestionnaires.map(q =>
        q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
      ),
      followUpQuestionnaires: prev.followUpQuestionnaires.map(q =>
        q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
      )
    }));

    setIsEditingQuestion(null);
    toast.success('Question saved');
  };

  const _handleDeleteQuestion = (questionId: string) => {
    if (!selectedQuestionnaire) return;

    const updatedQuestionnaire = {
      ...selectedQuestionnaire,
      questions: selectedQuestionnaire.questions.filter(q => q.id !== questionId)
    };

    setSelectedQuestionnaire(updatedQuestionnaire);
    
    setData(prev => ({
      ...prev,
      onboardingQuestionnaires: prev.onboardingQuestionnaires.map(q =>
        q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
      ),
      followUpQuestionnaires: prev.followUpQuestionnaires.map(q =>
        q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
      )
    }));

    toast.success('Question deleted');
  };

  const _handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    if (!selectedQuestionnaire) return;

    const questions = [...selectedQuestionnaire.questions];
    const index = questions.findIndex(q => q.id === questionId);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
    
    // Update order values
    questions.forEach((q, i) => {
      q.order = i;
    });

    const updatedQuestionnaire = {
      ...selectedQuestionnaire,
      questions
    };

    setSelectedQuestionnaire(updatedQuestionnaire);
    
    setData(prev => ({
      ...prev,
      onboardingQuestionnaires: prev.onboardingQuestionnaires.map(q =>
        q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
      ),
      followUpQuestionnaires: prev.followUpQuestionnaires.map(q =>
        q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
      )
    }));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Versions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeVersions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Forms</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.onboardingQuestionnaires.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-up Forms</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.followUpQuestionnaires.length}</div>
          </CardContent>
        </Card>
      </div>

      {selectedQuestionnaire ? (
        <ImprovedQuestionnaireEditor
          questionnaire={selectedQuestionnaire}
          isPreviewMode={isPreviewMode}
          onBack={() => {
            setSelectedQuestionnaire(null);
            setIsPreviewMode(false);
          }}
          onSave={(updatedQuestionnaire) => {
            setSelectedQuestionnaire(updatedQuestionnaire);
            // Update in main data
            setData(prev => ({
              ...prev,
              onboardingQuestionnaires: prev.onboardingQuestionnaires.map(q =>
                q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
              ),
              followUpQuestionnaires: prev.followUpQuestionnaires.map(q =>
                q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
              )
            }));
          }}
          onAddQuestion={handleAddQuestion}
          onEditQuestion={handleEditQuestion}
          editingQuestion={isEditingQuestion}
          onSaveQuestion={handleSaveQuestion}
          onCancelEdit={() => setIsEditingQuestion(null)}
        />
      ) : (
        <Tabs defaultValue="onboarding" className="space-y-4">
          <TabsList>
            <TabsTrigger value="onboarding">Onboarding Questionnaires</TabsTrigger>
            <TabsTrigger value="followup">Follow-up Questionnaires</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="onboarding" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Onboarding Questionnaires</h3>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </div>

            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.onboardingQuestionnaires.map((questionnaire) => (
                      <TableRow key={questionnaire.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{questionnaire.name}</div>
                            {questionnaire.description && (
                              <div className="text-sm text-muted-foreground">
                                {questionnaire.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{questionnaire.version}</Badge>
                        </TableCell>
                        <TableCell>{questionnaire.questions.length}</TableCell>
                        <TableCell>{getStatusBadge(questionnaire.isActive)}</TableCell>
                        <TableCell>
                          {questionnaire.updatedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewQuestionnaire(questionnaire)}
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestionnaire(questionnaire)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateQuestionnaire(questionnaire.id)}
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(questionnaire.id, questionnaire.isActive)}
                              title={questionnaire.isActive ? "Pause" : "Activate"}
                            >
                              {questionnaire.isActive ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followup" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Follow-up Questionnaires</h3>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </div>

            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.followUpQuestionnaires.map((questionnaire) => (
                      <TableRow key={questionnaire.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{questionnaire.name}</div>
                            {questionnaire.description && (
                              <div className="text-sm text-muted-foreground">
                                {questionnaire.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{questionnaire.version}</Badge>
                        </TableCell>
                        <TableCell>{questionnaire.questions.length}</TableCell>
                        <TableCell>{getStatusBadge(questionnaire.isActive)}</TableCell>
                        <TableCell>
                          {questionnaire.updatedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewQuestionnaire(questionnaire)}
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestionnaire(questionnaire)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateQuestionnaire(questionnaire.id)}
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(questionnaire.id, questionnaire.isActive)}
                              title={questionnaire.isActive ? "Pause" : "Activate"}
                            >
                              {questionnaire.isActive ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Questionnaire Templates</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Questions:</span>
                        <Badge variant="outline">{template.questions.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Category:</span>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button className="w-full" variant="outline">
                        <Copy className="mr-2 h-4 w-4" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Activation Modal - when activating an onboarding questionnaire with another active */}
      <Dialog open={showActivationModal} onOpenChange={setShowActivationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Onboarding Questionnaire</DialogTitle>
            <DialogDescription>
              There is already an active onboarding questionnaire. Activating this questionnaire will automatically pause the currently active one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivationModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => pendingActivationId && performToggle(pendingActivationId, true)}
            >
              Activate and Pause Other
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Modal - when deactivating the only active onboarding questionnaire */}
      <Dialog open={showDeactivationModal} onOpenChange={setShowDeactivationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Onboarding Questionnaire</DialogTitle>
            <DialogDescription>
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <AlertTitle className="ml-6 mt-1">Warning</AlertTitle>
                  <AlertDescription className="mt-1">
                    You are about to deactivate the only active onboarding questionnaire. This means new users signing up will not receive any questionnaire during onboarding.
                  </AlertDescription>
                </div>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivationModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => pendingActivationId && performToggle(pendingActivationId, false)}
            >
              Deactivate Questionnaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

