'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Copy, Eye, EyeOff, Edit, Lock } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { toast } from 'sonner';
import { InlineEdit } from './inline-edit';
import { getValidatorForKey } from '../lib/validators';

interface ConfigurationItemProps {
  config: {
    id: string;
    key: string;
    value: string;
    is_sensitive: boolean;
    updated_at: Date | string;
    created_at: Date | string;
  };
  onEdit: (config: Record<string, unknown>) => void;
  onUpdate: (key: string, value: string) => Promise<void>;
  onEditSensitive: (config: Record<string, unknown>) => void;
}

export function ConfigurationItem({ config, onEdit: _onEdit, onUpdate, onEditSensitive }: ConfigurationItemProps) {
  const [showSensitive, setShowSensitive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(config.key);
    toast.success('Configuration key copied to clipboard');
  };

  const handleCopyValue = () => {
    if (!config.is_sensitive || showSensitive) {
      navigator.clipboard.writeText(config.value);
      toast.success('Configuration value copied to clipboard');
    }
  };

  const handleSave = async (newValue: string) => {
    await onUpdate(config.key, newValue);
    setIsEditing(false);
  };

  const displayValue = config.is_sensitive && !showSensitive 
    ? '••••••••' 
    : config.value;

  const validator = getValidatorForKey(config.key);

  if (isEditing && !config.is_sensitive) {
    return (
      <div className="py-3 px-4 bg-muted/30 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {config.key}
            </code>
          </div>
          <InlineEdit
            value={config.value}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            validator={validator}
            placeholder="Enter configuration value..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {config.key}
          </code>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleCopyKey}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy key</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-mono">
            {displayValue}
          </span>
          {config.is_sensitive && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setShowSensitive(!showSensitive)}
                  >
                    {showSensitive ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showSensitive ? 'Hide' : 'Show'} value</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {(!config.is_sensitive || showSensitive) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleCopyValue}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy value</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Updated {format(new Date(config.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
        </p>
      </div>
      
      {config.is_sensitive ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEditSensitive(config)}
        >
          <Lock className="mr-2 h-3 w-3" />
          Set New Value
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="mr-2 h-3 w-3" />
          Edit
        </Button>
      )}
    </div>
  );
}