# Admin Panel Page Structure Guidelines

## Common Page Pattern (Based on Existing Platform Pages)

All admin panel pages should follow the exact same structure as existing organization pages for consistency.

### Standard Page Structure

```tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { IconName } from 'lucide-react';

// Auth imports
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';

// UI Component imports (Achromatic)
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';

// Data imports
import { getMetrics } from '~/data/admin/get-metrics';

// Metadata
export const metadata: Metadata = {
  title: 'Page Title | Minery Admin',
  description: 'Page description',
};

// Props interface
interface AdminPageProps {
  params: {
    // params if needed
  };
}

// Main component - ALWAYS async
export default async function AdminPageName({ params }: AdminPageProps) {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  // 2. Admin authorization check
  await requirePlatformAdmin();
  
  // 3. Data fetching (parallel when possible)
  const [data1, data2] = await Promise.all([
    getData1(),
    getData2()
  ]);
  
  // 4. Return Page structure
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <IconName className="h-6 w-6 text-primary" />
            <PageTitle title="Admin Dashboard" />
          </div>
        </PagePrimaryBar>
        <PageActions>
          {/* Action buttons if needed */}
          <Link href="/admin/new">
            <Button>New Action</Button>
          </Link>
        </PageActions>
      </PageHeader>
      
      <PageBody>
        {/* Main content - usually cards */}
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Grid for multiple cards */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Title</CardTitle>
                <CardDescription>Description</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Content */}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
```

## Key Patterns to Follow

### 1. Page Layout Structure
```
Page
├── PageHeader
│   ├── PagePrimaryBar (title + icon)
│   └── PageActions (buttons)
└── PageBody
    └── Content container (max-w-7xl)
        └── Cards/Tables/Components
```

### 2. Content Layout Patterns

**Dashboard Grid (like home page):**
```tsx
<div className="mx-auto max-w-7xl space-y-6 p-6">
  {/* Metrics grid */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {/* Metric cards */}
  </div>
  
  {/* Main content grid */}
  <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2">
      {/* Main content */}
    </div>
    <div>
      {/* Sidebar content */}
    </div>
  </div>
</div>
```

**List Page (like assessments):**
```tsx
<PageBody>
  <div className="mx-auto max-w-7xl space-y-6 p-6">
    {/* Summary cards */}
    <div className="grid gap-4 md:grid-cols-3">
      {/* Stats cards */}
    </div>
    
    {/* Main table/list */}
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table />
      </CardContent>
    </Card>
  </div>
</PageBody>
```

### 3. Card Patterns

**Metric Card:**
```tsx
<Card>
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Metric Title
      </CardTitle>
      <Icon className="h-4 w-4 text-primary" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">
      {description}
    </p>
  </CardContent>
</Card>
```

**List Card:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </div>
      <Link href="/view-all">
        <Button variant="outline" size="sm">
          View All
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </Link>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      {items.map(item => (
        <ItemRow key={item.id} />
      ))}
    </div>
  </CardContent>
</Card>
```

### 4. Common UI Patterns

**Empty State:**
```tsx
<div className="text-center py-8 text-muted-foreground">
  <Icon className="h-12 w-12 mx-auto mb-3 opacity-20" />
  <p className="text-sm">No items found</p>
  <Link href="/new">
    <Button variant="outline" size="sm" className="mt-3">
      Add First Item
    </Button>
  </Link>
</div>
```

**Loading State:**
```tsx
<Card>
  <CardContent className="p-6">
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </CardContent>
</Card>
```

**Status Badge:**
```tsx
<Badge variant={status === 'active' ? 'default' : 'secondary'}>
  {statusLabel}
</Badge>
```

### 5. Admin-Specific Components

For admin pages, create a custom PageTitle component:

```tsx
// components/admin/admin-page-title.tsx
export function AdminPageTitle({ title, info }: { title: string; info?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {info && <p className="text-sm text-muted-foreground">{info}</p>}
    </div>
  );
}
```

### 6. Data Fetching Pattern

Always fetch data at the page level (server component):

```tsx
// Good - parallel fetching
const [metrics, messages, requests] = await Promise.all([
  getMetrics(),
  getMessages(),
  getServiceRequests()
]);

// Bad - sequential fetching
const metrics = await getMetrics();
const messages = await getMessages();
const requests = await getServiceRequests();
```

### 7. Responsive Design

Follow existing breakpoints:
- Mobile: default
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)

Common responsive patterns:
- Grid columns: `grid gap-4 md:grid-cols-2 lg:grid-cols-4`
- Content width: `mx-auto max-w-7xl`
- Padding: `p-4 md:p-6`
- Text size: `text-sm md:text-base`

### 8. Color Usage

Use existing design tokens:
- Primary actions: `text-primary`, `bg-primary`
- Muted text: `text-muted-foreground`
- Borders: `border`
- Backgrounds: `bg-background`, `bg-muted`
- Hover states: `hover:bg-muted/50`

### 9. Icon Usage

- Size in headers: `h-6 w-6`
- Size in cards: `h-4 w-4`
- Size in buttons: `h-4 w-4 mr-2` (with margin)
- Empty states: `h-12 w-12`

### 10. Spacing Consistency

- Page padding: `p-6`
- Card spacing: `space-y-6`
- Grid gaps: `gap-4` or `gap-6`
- Item spacing: `space-y-2` or `space-y-4`

## Example Admin Dashboard Page

```tsx
// app/admin/dashboard/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BarChart3, Users, MessageSquare, TrendingUp } from 'lucide-react';

import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { AdminPageTitle } from '~/components/admin/admin-page-title';
import { getAdminMetrics } from '~/data/admin/get-metrics';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Minery',
  description: 'Platform administration dashboard',
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  await requirePlatformAdmin();
  
  const metrics = await getAdminMetrics();
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title="Platform Dashboard" 
              info="Monitor platform metrics and activity"
            />
          </div>
        </PagePrimaryBar>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Organizations"
              value={metrics.organizations}
              icon={Users}
              trend="+12%"
            />
            {/* More metric cards... */}
          </div>
          
          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ServiceRequestsCard requests={metrics.recentRequests} />
            </div>
            <div>
              <RecentMessagesCard messages={metrics.recentMessages} />
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
```

## Summary

By following these patterns from existing pages, the admin panel will:
1. **Look consistent** with the rest of the platform
2. **Feel familiar** to users
3. **Be maintainable** using the same patterns
4. **Develop faster** by copying existing code

The key is to study pages like `/home`, `/services`, and `/assessments` and replicate their structure exactly, just with admin-specific data and authorization.