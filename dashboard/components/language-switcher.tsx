'use client';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { LanguagesIcon, CheckIcon } from 'lucide-react';
import { useLanguageSwitcher } from '@/hooks/use-translations';

const languages = {
  en: { 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇬🇧' 
  },
  es: { 
    name: 'Spanish', 
    nativeName: 'Español', 
    flag: '🇪🇸' 
  },
};

interface LanguageSwitcherProps {
  variant?: 'ghost' | 'outline' | 'default';
  showLabel?: boolean;
}

export function LanguageSwitcher({ 
  variant = 'ghost', 
  showLabel = true 
}: LanguageSwitcherProps) {
  const { currentLocale, availableLocales, switchLanguage, isPending } = useLanguageSwitcher();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" disabled={isPending}>
          <LanguagesIcon className="h-4 w-4" />
          {showLabel && (
            <span className="ml-2">
              {languages[currentLocale].flag} {languages[currentLocale].nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLanguage(locale)}
            disabled={locale === currentLocale}
          >
            <span className="mr-2">{languages[locale].flag}</span>
            <span>{languages[locale].nativeName}</span>
            {locale === currentLocale && (
              <CheckIcon className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}