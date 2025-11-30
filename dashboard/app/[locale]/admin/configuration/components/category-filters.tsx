'use client';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';

interface CategoryFiltersProps {
  categories: string[];
  selectedCategories: string[];
  configCounts: Record<string, number>;
  onToggleCategory: (category: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const categoryLabels: Record<string, string> = {
  analytics: 'Analytics',
  email: 'Email',
  monitoring: 'Monitoring',
  billing: 'Billing',
  api: 'API',
  other: 'Other'
};

export function CategoryFilters({
  categories,
  selectedCategories,
  configCounts,
  onToggleCategory,
  onShowAll,
  onHideAll,
}: CategoryFiltersProps) {
  const allSelected = selectedCategories.length === categories.length;
  const _noneSelected = selectedCategories.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={allSelected ? 'default' : 'outline'}
        onClick={onShowAll}
      >
        Show All
      </Button>
      
      <div className="h-6 w-px bg-border" />
      
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category);
        const count = configCounts[category] || 0;
        
        return (
          <Button
            key={category}
            size="sm"
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onToggleCategory(category)}
            className="gap-2"
          >
            {categoryLabels[category] || category}
            <Badge 
              variant={isSelected ? 'secondary' : 'outline'} 
              className="ml-1 h-5 px-1"
            >
              {count}
            </Badge>
          </Button>
        );
      })}
      
      {selectedCategories.length > 0 && selectedCategories.length < categories.length && (
        <>
          <div className="h-6 w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onHideAll}
          >
            Clear Filters
          </Button>
        </>
      )}
    </div>
  );
}