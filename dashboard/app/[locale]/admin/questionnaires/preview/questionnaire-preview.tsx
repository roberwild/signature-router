'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Separator } from '@workspace/ui/components/separator';
import {
  Play,
  RotateCcw,
  Monitor,
  Smartphone,
  CheckCircle,
  AlertCircle,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';
import type { QuestionnaireVersion } from '~/data/admin/questionnaires/get-questionnaire-configs';
import { PreviewSimulator } from './preview-simulator';
import { ResponseLogger } from './response-logger';

interface QuestionnairePreviewProps {
  onboardingQuestionnaires: QuestionnaireVersion[];
  followUpQuestionnaires: QuestionnaireVersion[];
  locale: string;
}

interface PreviewSettings {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userCategory: 'A1' | 'B1' | 'C1' | 'D1' | 'new';
  simulateDelay: boolean;
  showDebugInfo: boolean;
  mockUserData: {
    name: string;
    email: string;
    organizationName: string;
    previousResponses: number;
  };
}

export function QuestionnairePreview({ 
  onboardingQuestionnaires, 
  followUpQuestionnaires,
  locale: _locale
}: QuestionnairePreviewProps) {
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireVersion | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [previewType, setPreviewType] = useState<'onboarding' | 'followup'>('onboarding');
  const [responses, setResponses] = useState<Array<{ questionId: string; response: unknown; timestamp: Date; userCategory: string; deviceType: string }>>([]);
  
  const [settings, setSettings] = useState<PreviewSettings>({
    deviceType: 'desktop',
    userCategory: 'new',
    simulateDelay: false,
    showDebugInfo: true,
    mockUserData: {
      name: 'Test User',
      email: 'test@example.com',
      organizationName: 'Test Organization',
      previousResponses: 0
    }
  });

  const activeOnboardingQuestionnaire = onboardingQuestionnaires.find(q => q.isActive);
  const activeFollowUpQuestionnaires = followUpQuestionnaires.filter(q => q.isActive);

  const handleStartPreview = (questionnaire: QuestionnaireVersion, type: 'onboarding' | 'followup') => {
    setSelectedQuestionnaire(questionnaire);
    setPreviewType(type);
    setIsPreviewActive(true);
    setResponses([]);
    
    toast.info(`Starting ${type} questionnaire preview`, {
      description: `Testing: ${questionnaire.name}`
    });
  };

  const handleStopPreview = () => {
    setIsPreviewActive(false);
    setSelectedQuestionnaire(null);
    toast.success('Preview session ended', {
      description: `${responses.length} responses were simulated (not saved)`
    });
  };

  const handleResetPreview = () => {
    setResponses([]);
    toast.info('Preview reset', {
      description: 'All test responses cleared'
    });
  };

  const handleResponseSubmit = (questionId: string, response: unknown) => {
    const newResponse = {
      questionId,
      response,
      timestamp: new Date(),
      userCategory: settings.userCategory,
      deviceType: settings.deviceType
    };
    
    setResponses(prev => [...prev, newResponse]);
    
    if (settings.showDebugInfo) {
      console.log('Test Response:', newResponse);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Settings</CardTitle>
          <CardDescription>
            Configure the test environment for questionnaire preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select 
                value={settings.deviceType} 
                onValueChange={(value: string) => setSettings(prev => ({ ...prev, deviceType: value as 'desktop' | 'mobile' | 'tablet' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">
                    <div className="flex items-center">
                      <Monitor className="mr-2 h-4 w-4" />
                      Desktop
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile">
                    <div className="flex items-center">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Mobile
                    </div>
                  </SelectItem>
                  <SelectItem value="tablet">
                    <div className="flex items-center">
                      <Monitor className="mr-2 h-4 w-4" />
                      Tablet
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>User Category</Label>
              <Select 
                value={settings.userCategory} 
                onValueChange={(value: string) => setSettings(prev => ({ ...prev, userCategory: value as 'A1' | 'B1' | 'C1' | 'D1' | 'new' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New User (Onboarding)</SelectItem>
                  <SelectItem value="A1">A1 - High Priority</SelectItem>
                  <SelectItem value="B1">B1 - Medium Priority</SelectItem>
                  <SelectItem value="C1">C1 - Low Priority</SelectItem>
                  <SelectItem value="D1">D1 - Minimal Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mock User Name</Label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={settings.mockUserData.name}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  mockUserData: { ...prev.mockUserData, name: e.target.value }
                }))}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.simulateDelay}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, simulateDelay: checked }))}
              />
              <Label>Simulate Network Delay</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.showDebugInfo}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showDebugInfo: checked }))}
              />
              <Label>Show Debug Info</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Preview Interface */}
      <Tabs defaultValue="onboarding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onboarding">Onboarding Questionnaires</TabsTrigger>
          <TabsTrigger value="followup">Follow-up Questionnaires</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-4">
          {!activeOnboardingQuestionnaire ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">No Active Onboarding Questionnaire</AlertTitle>
                <AlertDescription className="mt-1">
                  Please activate an onboarding questionnaire in the Configuration section to test it.
                </AlertDescription>
              </div>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{activeOnboardingQuestionnaire.name}</CardTitle>
                    <CardDescription>
                      {activeOnboardingQuestionnaire.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {activeOnboardingQuestionnaire.questions.length} Questions
                    </Badge>
                    <Badge variant="outline" className="border-green-600/50 text-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!isPreviewActive || previewType !== 'onboarding' ? (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Ready to test the onboarding flow
                      </div>
                      <Button 
                        onClick={() => handleStartPreview(activeOnboardingQuestionnaire, 'onboarding')}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Preview
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <TestTube className="h-4 w-4" />
                        <div>
                          <AlertTitle className="ml-6 mt-1">Test Mode Active</AlertTitle>
                          <AlertDescription className="mt-1">
                            Responses are being simulated and will not be saved to the database
                          </AlertDescription>
                        </div>
                      </Alert>
                      
                      <PreviewSimulator
                        questionnaire={selectedQuestionnaire!}
                        settings={settings}
                        onResponse={handleResponseSubmit}
                        isActive={isPreviewActive}
                      />

                      <div className="flex items-center justify-between pt-4">
                        <Button 
                          variant="outline" 
                          onClick={handleResetPreview}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleStopPreview}
                        >
                          Stop Preview
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          {activeFollowUpQuestionnaires.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">No Active Follow-up Questionnaires</AlertTitle>
                <AlertDescription className="mt-1">
                  Please activate follow-up questionnaires in the Configuration section to test them.
                </AlertDescription>
              </div>
            </Alert>
          ) : (
            <div className="space-y-4">
              {activeFollowUpQuestionnaires.map((questionnaire) => (
                <Card key={questionnaire.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{questionnaire.name}</CardTitle>
                        <CardDescription>
                          {questionnaire.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {questionnaire.questions.length} Questions
                        </Badge>
                        <Badge variant="outline" className="border-green-600/50 text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(!isPreviewActive || selectedQuestionnaire?.id !== questionnaire.id) ? (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Test follow-up questionnaire flow
                        </div>
                        <Button 
                          onClick={() => handleStartPreview(questionnaire, 'followup')}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Preview
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Alert>
                          <TestTube className="h-4 w-4" />
                          <div>
                            <AlertTitle className="ml-6 mt-1">Test Mode Active</AlertTitle>
                            <AlertDescription className="mt-1">
                              Testing follow-up questionnaire for {settings.userCategory} user category
                            </AlertDescription>
                          </div>
                        </Alert>
                        
                        <PreviewSimulator
                          questionnaire={selectedQuestionnaire!}
                          settings={settings}
                          onResponse={handleResponseSubmit}
                          isActive={isPreviewActive}
                        />

                        <div className="flex items-center justify-between pt-4">
                          <Button 
                            variant="outline" 
                            onClick={handleResetPreview}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleStopPreview}
                          >
                            Stop Preview
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Logger */}
      {responses.length > 0 && (
        <ResponseLogger 
          responses={responses} 
          showDebugInfo={settings.showDebugInfo}
          onClear={() => setResponses([])}
        />
      )}
    </div>
  );
}