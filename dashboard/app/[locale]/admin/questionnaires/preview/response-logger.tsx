'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Trash2, Download, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ResponseLoggerProps {
  responses: Array<{
    questionId: string;
    response: unknown;
    timestamp: Date;
    userCategory: string;
    deviceType: string;
  }>;
  showDebugInfo: boolean;
  onClear: () => void;
}

export function ResponseLogger({ responses, showDebugInfo, onClear }: ResponseLoggerProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      testMode: true,
      responses: responses.map(r => ({
        ...r,
        timestamp: r.timestamp.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questionnaire-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A1': return 'bg-green-500';
      case 'B1': return 'bg-blue-500';
      case 'C1': return 'bg-yellow-500';
      case 'D1': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return '📱';
      case 'tablet': return '📋';
      default: return '💻';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Test Response Log</CardTitle>
            <CardDescription>
              {responses.length} responses captured (not saved to database)
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Details
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClear}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Question ID</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>User Category</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs">
                    {response.timestamp.toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {response.questionId.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {showDetails ? (
                      <pre className="text-xs overflow-auto max-w-xs">
                        {JSON.stringify(response.response, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-sm">
                        {typeof response.response === 'object' 
                          ? `[${Array.isArray(response.response) ? 'Array' : 'Object'}]`
                          : String(response.response).slice(0, 50)
                        }
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${getCategoryColor(response.userCategory)} bg-opacity-20`}
                    >
                      {response.userCategory}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span title={response.deviceType}>
                      {getDeviceIcon(response.deviceType)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {showDebugInfo && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Raw Response Data:</p>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(responses, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}