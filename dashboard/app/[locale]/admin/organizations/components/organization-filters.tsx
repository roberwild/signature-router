'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

export function OrganizationFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name');

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      router.push(`?${params.toString()}`);
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set('sortBy', value);
      router.push(`?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSortBy('name');
    startTransition(() => {
      router.push('?');
    });
  };

  const hasFilters = searchParams.get('search') || searchParams.get('sortBy');

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
            disabled={isPending}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isPending}
          variant="secondary"
        >
          Search
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={handleSortChange} disabled={isPending}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
            <SelectItem value="members">Most Members</SelectItem>
            <SelectItem value="membersAsc">Least Members</SelectItem>
            <SelectItem value="slug">Slug (A-Z)</SelectItem>
          </SelectContent>
        </Select>
        
        {hasFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}