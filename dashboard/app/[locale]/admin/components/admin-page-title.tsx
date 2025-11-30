/**
 * Admin Page Title Component
 * Displays page title with optional info/description
 */

export interface AdminPageTitleProps {
  title: string;
  info?: string;
}

export function AdminPageTitle({ title, info }: AdminPageTitleProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {info && (
        <p className="text-sm text-muted-foreground mt-0.5">{info}</p>
      )}
    </div>
  );
}
