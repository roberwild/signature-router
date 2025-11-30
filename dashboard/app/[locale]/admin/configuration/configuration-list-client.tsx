'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { toast } from 'sonner';
import { SearchBar } from './components/search-bar';
import { CategoryFilters } from './components/category-filters';
import { ConfigurationCard } from './components/configuration-card';
import { SensitiveConfigModal } from './components/sensitive-config-modal';
import { AddConfigurationModal } from './components/add-configuration-modal';
import { ImportExportButtons } from './components/import-export-buttons';

interface Configuration {
  id: string;
  key: string;
  value: string;
  category: string;
  is_sensitive: boolean;
  updated_at: Date | string;
  created_at: Date | string;
}

interface ConfigurationListClientProps {
  configs: Configuration[];
  groupedConfigs: Record<string, Configuration[]>;
  locale: string;
}

export function ConfigurationListClient({ 
  configs, 
  groupedConfigs, 
  locale: _locale
}: ConfigurationListClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    groupedConfigs ? Object.keys(groupedConfigs) : []
  );
  const [configsList, setConfigsList] = useState(configs || []);
  const [groupedConfigsList, setGroupedConfigsList] = useState(groupedConfigs || {});
  const [sensitiveModalConfig, setSensitiveModalConfig] = useState<Configuration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get all unique categories
  const allCategories = groupedConfigs ? Object.keys(groupedConfigs) : [];
  
  // Calculate config counts per category
  const configCounts = useMemo(() => {
    if (!groupedConfigs) return {};
    return Object.entries(groupedConfigs).reduce((acc, [category, configs]) => {
      acc[category] = configs.length;
      return acc;
    }, {} as Record<string, number>);
  }, [groupedConfigs]);

  // Filter configurations based on search and category
  const filteredGroupedConfigs = useMemo(() => {
    const filtered: Record<string, Configuration[]> = {};
    
    if (!groupedConfigsList) return filtered;
    
    Object.entries(groupedConfigsList).forEach(([category, categoryConfigs]) => {
      // Skip if category not selected
      if (!selectedCategories.includes(category)) {
        return;
      }
      
      // Filter by search term
      const searchFiltered = searchTerm
        ? categoryConfigs.filter(config => 
            config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (!config.is_sensitive && config.value.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : categoryConfigs;
      
      if (searchFiltered.length > 0) {
        filtered[category] = searchFiltered;
      }
    });
    
    return filtered;
  }, [groupedConfigsList, selectedCategories, searchTerm]);

  const handleToggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleShowAll = () => {
    setSelectedCategories(allCategories);
  };

  const handleHideAll = () => {
    setSelectedCategories([]);
  };

  const handleEdit = (config: Record<string, unknown>) => {
    // Legacy function - kept for compatibility
    console.log('Edit config:', config);
  };

  const handleUpdate = async (key: string, value: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/config/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update configuration');
      }

      const _data = await response.json();
      
      // Update local state
      const updatedConfigs = configsList.map(c => 
        c.key === key ? { ...c, value, updated_at: new Date().toISOString() } : c
      );
      setConfigsList(updatedConfigs);
      
      // Update grouped configs
      const newGrouped = { ...groupedConfigsList };
      Object.keys(newGrouped).forEach(category => {
        newGrouped[category] = newGrouped[category].map(c => 
          c.key === key ? { ...c, value, updated_at: new Date().toISOString() } : c
        );
      });
      setGroupedConfigsList(newGrouped);

      toast.success('Configuration updated successfully');
      setSuccessMessage('Configuration updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const handleEditSensitive = (config: Record<string, unknown>) => {
    setSensitiveModalConfig(config as unknown as Configuration);
  };

  const handleSaveSensitive = async (value: string) => {
    if (!sensitiveModalConfig) return;
    
    await handleUpdate(sensitiveModalConfig.key, value);
    setSensitiveModalConfig(null);
  };

  const handleAddSuccess = () => {
    // Reload the page to fetch updated configs
    router.refresh();
  };

  const totalFilteredConfigs = Object.values(filteredGroupedConfigs).reduce(
    (sum, configs) => sum + configs.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header with search and buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by key or value..."
          />
        </div>
        <div className="flex gap-2">
          <ImportExportButtons onImportSuccess={handleAddSuccess} />
          <AddConfigurationModal onSuccess={handleAddSuccess} />
        </div>
      </div>

      {/* Category filters */}
      {allCategories.length > 0 && (
        <CategoryFilters
          categories={allCategories}
          selectedCategories={selectedCategories}
          configCounts={configCounts}
          onToggleCategory={handleToggleCategory}
          onShowAll={handleShowAll}
          onHideAll={handleHideAll}
        />
      )}

      {/* Configuration cards */}
      {Object.keys(filteredGroupedConfigs).length === 0 ? (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'No configurations found' : 'No configurations yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm 
              ? 'Try adjusting your search or filters'
              : 'Add your first configuration to get started'}
          </p>
          {!searchTerm && (
            <AddConfigurationModal onSuccess={handleAddSuccess} />
          )}
        </div>
      ) : (
        <>
          {searchTerm && (
            <p className="text-sm text-muted-foreground">
              Found {totalFilteredConfigs} configuration{totalFilteredConfigs !== 1 ? 's' : ''} matching "{searchTerm}"
            </p>
          )}
          <div className="grid gap-6">
            {filteredGroupedConfigs && Object.entries(filteredGroupedConfigs)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, configs]) => (
                <ConfigurationCard
                  key={category}
                  category={category}
                  configs={configs}
                  onEdit={handleEdit}
                  onUpdate={handleUpdate}
                  onEditSensitive={handleEditSensitive}
                />
              ))}
          </div>
        </>
      )}

      {/* Sensitive Config Modal */}
      {sensitiveModalConfig && (
        <SensitiveConfigModal
          open={!!sensitiveModalConfig}
          onClose={() => setSensitiveModalConfig(null)}
          configKey={sensitiveModalConfig.key}
          onSave={handleSaveSensitive}
        />
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
          <Alert className="w-96">
            <CheckCircle className="h-4 w-4" />
            <div>
              <AlertTitle className="ml-6 mt-1">Success</AlertTitle>
              <AlertDescription className="mt-1">
                {successMessage}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
          <Alert variant="destructive" className="w-96">
            <XCircle className="h-4 w-4" />
            <div>
              <AlertTitle className="ml-6 mt-1">Error</AlertTitle>
              <AlertDescription className="mt-1">
                {error}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}