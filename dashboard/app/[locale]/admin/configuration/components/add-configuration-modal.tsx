'use client';

import { useState, useEffect } from 'react';
import { Plus, Shield } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { toast } from 'sonner';

// Form validation schema
const addConfigSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPER_SNAKE_CASE format'),
  value: z.string().min(1, 'Value is required'),
  category: z.enum(['analytics', 'email', 'monitoring', 'billing', 'api', 'other']),
  is_sensitive: z.boolean().default(false)
});

type AddConfigFormData = z.infer<typeof addConfigSchema>;

interface AddConfigurationModalProps {
  onSuccess?: () => void;
}

const categories = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'email', label: 'Email' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'billing', label: 'Billing' },
  { value: 'api', label: 'API' },
  { value: 'other', label: 'Other' }
];

export function AddConfigurationModal({ onSuccess }: AddConfigurationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AddConfigFormData>({
    key: '',
    value: '',
    category: 'other',
    is_sensitive: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AddConfigFormData, string>>>({});

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        key: '',
        value: '',
        category: 'other',
        is_sensitive: false
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateField = (field: keyof AddConfigFormData, value: unknown) => {
    try {
      const schema = addConfigSchema.shape[field];
      schema.parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setFormData(prev => ({ ...prev, key: value }));
    if (value) {
      validateField('key', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    try {
      addConfigSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof AddConfigFormData, string>> = {};
        error.errors.forEach(err => {
          const path = err.path[0] as keyof AddConfigFormData;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.code === 'DUPLICATE_KEY') {
          setErrors({ key: 'This configuration key already exists' });
          setIsSaving(false);
          return;
        }
        throw new Error(errorData.error?.message || 'Failed to create configuration');
      }

      toast.success('Configuration created successfully');
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = !Object.values(errors).some(Boolean) && 
                      formData.key && 
                      formData.value && 
                      formData.category;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Configuration</DialogTitle>
          <DialogDescription>
            Create a new configuration value for the platform.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key field */}
          <div className="space-y-2">
            <Label htmlFor="key">Configuration Key</Label>
            <Input
              id="key"
              placeholder="EXAMPLE_CONFIG_KEY"
              value={formData.key}
              onChange={handleKeyChange}
              disabled={isSaving}
              className={errors.key ? 'border-destructive' : ''}
            />
            <p className="text-sm text-muted-foreground">
              Use UPPER_SNAKE_CASE format (e.g., API_ENDPOINT_URL)
            </p>
            {errors.key && (
              <p className="text-sm text-destructive">{errors.key}</p>
            )}
          </div>

          {/* Value field */}
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Textarea
              id="value"
              placeholder="Enter configuration value..."
              value={formData.value}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, value: e.target.value }));
                validateField('value', e.target.value);
              }}
              disabled={isSaving}
              className={errors.value ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.value && (
              <p className="text-sm text-destructive">{errors.value}</p>
            )}
          </div>

          {/* Category field */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, category: value as AddConfigFormData['category'] }));
              }}
              disabled={isSaving}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Is Sensitive checkbox */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_sensitive"
                checked={formData.is_sensitive}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, is_sensitive: !!checked }));
                }}
                disabled={isSaving}
              />
              <Label htmlFor="is_sensitive" className="cursor-pointer">
                Mark as sensitive configuration
              </Label>
            </div>
          </div>

          {/* Sensitive value warning */}
          {formData.is_sensitive && (
            <Alert>
              <Shield className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">Sensitive Value</AlertTitle>
                <AlertDescription className="mt-1">
                  This value will be encrypted and permanently masked. 
                  You won't be able to view it again after saving.
                </AlertDescription>
              </div>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}