'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@workspace/ui/components/breadcrumb';

interface QuestionnaireBreadcrumbProps {
  locale: string;
  currentPage?: string;
}

export function QuestionnaireBreadcrumb({ locale, currentPage }: QuestionnaireBreadcrumbProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/admin`}>
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {currentPage ? (
                <BreadcrumbLink href={`/${locale}/admin/questionnaires`}>
                  Questionnaires
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Questionnaires</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {currentPage && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}