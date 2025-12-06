# Epic 13: Provider Management UI - Mockup & Design

**Fecha:** 5 de diciembre de 2025  
**Epic:** Epic 13 - MuleSoft Integration  
**Pantalla:** `/admin/providers`

---

## 📐 Layout Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Header: Provider Management                          [🔄 Sync] [🧪 Test All] │
│  Last sync: 2 minutes ago | 6 available | 4 enabled | 2 disabled              │
└────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────┐
│  📊 Global Stats (4 Cards)                                                     │
│  [Providers: 6] [Enabled: 4] [Health: 🟢3 🟡1 🔴0] [Last Sync: 2min ago]     │
└────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────┐
│  📱 SMS Providers (2)                                              [Collapse ▼]│
├────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Twilio SMS España                                    [●─────────] ENABLED│ │
│  │ ────────────────────────────────────────────────────────────────────────│ │
│  │                                                                          │ │
│  │ 📍 Status                                                                │ │
│  │    MuleSoft: 🟢 available       Health: 🟢 healthy (45ms)               │ │
│  │    Endpoint: /api/v1/signature/sms/twilio                               │ │
│  │    Provider ID: mule-twilio-sms-es                                      │ │
│  │                                                                          │ │
│  │ ⚙️  Configuration                                                        │ │
│  │    Priority: [───●─────────] 1   [↑] [↓]                                │ │
│  │    Timeout: 5s    Max Retries: 3                                        │ │
│  │                                                                          │ │
│  │ 📊 Real-time Metrics (desde MuleSoft)                                   │ │
│  │    Requests: 1,247    Success: 98.5%    Avg Latency: 142ms             │ │
│  │    Fallback Used: 0    Last Used: 2 min ago                            │ │
│  │                                                                          │ │
│  │ 🕒 Timestamps                                                            │ │
│  │    Last sync: 2 min ago                                                 │ │
│  │    Last health check: 30 sec ago                                        │ │
│  │                                                                          │ │
│  │                                   [🧪 Test] [📊 Metrics] [🔧 Configure] │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ AWS SNS España                                       [●─────────] ENABLED│ │
│  │ ────────────────────────────────────────────────────────────────────────│ │
│  │ ... (similar layout) ...                                                 │ │
│  │ Priority: [─────●───────] 2   [↑] [↓]  ⚠️ Fallback provider             │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│  🔔 PUSH Providers (1)                                             [Collapse ▼]│
├────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Firebase FCM                                        [─────────●] DISABLED│ │
│  │ ────────────────────────────────────────────────────────────────────────│ │
│  │                                                                          │ │
│  │ 📍 Status                                                                │ │
│  │    MuleSoft: 🔴 down             Health: 🔴 unhealthy                   │ │
│  │    Endpoint: /api/v1/signature/push/fcm                                 │ │
│  │    Provider ID: mule-fcm-push                                           │ │
│  │    ⚠️  Provider down in MuleSoft - Cannot enable until resolved         │ │
│  │                                                                          │ │
│  │ ⚙️  Configuration (inactive while disabled)                             │ │
│  │    Priority: [───●─────────] 1   [↑] [↓]  (inactive)                   │ │
│  │    Timeout: 3s    Max Retries: 2                                        │ │
│  │                                                                          │ │
│  │ 📊 Metrics                                                               │ │
│  │    Requests: 0    Success: N/A    Avg Latency: N/A                     │ │
│  │    ⚠️  Provider disabled - Not in use                                   │ │
│  │                                                                          │ │
│  │ 🕒 Timestamps                                                            │ │
│  │    Last sync: 1 min ago                                                 │ │
│  │    Last health check: Never (disabled)                                  │ │
│  │                                                                          │ │
│  │                                            [Enable] [📊 Metrics] [Delete]│ │
│  │    (Enable button disabled while MuleSoft status = down)                │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│  📞 VOICE Providers (2)                                            [Collapse ▼]│
│  (similar layout...)                                                           │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│  🔐 BIOMETRIC Providers (1)                                        [Collapse ▼]│
│  (similar layout...)                                                           │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Breakdown

### **1. Header Section**

```tsx
<div className="flex items-center justify-between p-6 border-b">
  <div>
    <h1 className="text-3xl font-bold flex items-center gap-2">
      <Server className="h-8 w-8" />
      Provider Management
    </h1>
    <p className="text-sm text-muted-foreground mt-1">
      Last sync: {lastSyncTime} | {availableCount} available | {enabledCount} enabled | {disabledCount} disabled
    </p>
  </div>
  
  <div className="flex gap-2">
    <Button variant="outline" onClick={syncFromMuleSoft} disabled={syncing}>
      <RefreshCw className={syncing ? 'animate-spin' : ''} />
      Sync from MuleSoft
    </Button>
    <Button variant="outline" onClick={testAllProviders}>
      <TestTube className="mr-2" />
      Test All Enabled
    </Button>
  </div>
</div>
```

---

### **2. Global Stats Cards**

```tsx
<div className="grid grid-cols-4 gap-4 p-6">
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">Total Providers</p>
      <p className="text-3xl font-bold">{providers.length}</p>
      <p className="text-xs text-muted-foreground mt-1">
        From MuleSoft catalog
      </p>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">Enabled</p>
      <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Active for routing
      </p>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">Health Status</p>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="bg-green-50 text-green-700">
          🟢 {healthyCount}
        </Badge>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          🟡 {degradedCount}
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700">
          🔴 {downCount}
        </Badge>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">Last Sync</p>
      <p className="text-2xl font-bold">{formatRelativeTime(lastSyncAt)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Auto-sync every 5 min
      </p>
    </CardContent>
  </Card>
</div>
```

---

### **3. Provider Card (Enabled)**

```tsx
<Card className="border-l-4 border-l-green-500">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2">
          {provider.providerName}
          <Badge variant="outline" className={getTypeColor(provider.providerType)}>
            {provider.providerType}
          </Badge>
        </CardTitle>
        <CardDescription className="font-mono text-xs mt-1">
          {provider.muleSoftEndpoint}
        </CardDescription>
      </div>
      
      {/* Enable/Disable Switch */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">
          {provider.enabled ? 'ENABLED' : 'DISABLED'}
        </Label>
        <Switch
          checked={provider.enabled}
          onCheckedChange={(checked) => toggleProvider(provider.id, checked)}
          disabled={provider.muleSoftStatus === 'down'}
        />
      </div>
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4">
    {/* Status Section */}
    <div className="rounded-lg border p-3 bg-gray-50">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Status
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">MuleSoft</p>
          <Badge variant="outline" className={getMuleSoftStatusColor(provider.muleSoftStatus)}>
            {getMuleSoftStatusIcon(provider.muleSoftStatus)} {provider.muleSoftStatus}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground">Health</p>
          <Badge variant="outline" className={getHealthStatusColor(provider.healthStatus)}>
            {getHealthStatusIcon(provider.healthStatus)} {provider.healthStatus}
            {provider.healthStatus === 'healthy' && ` (${provider.lastHealthLatency}ms)`}
          </Badge>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Endpoint</p>
          <p className="font-mono text-xs">{provider.muleSoftEndpoint}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Provider ID</p>
          <p className="font-mono text-xs text-blue-600">{provider.muleSoftProviderId}</p>
        </div>
      </div>
    </div>
    
    {/* Configuration Section */}
    <div className="rounded-lg border p-3 bg-gray-50">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Configuration
      </h4>
      
      {/* Priority Slider */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Priority</Label>
          <span className="text-sm font-bold">{provider.priority}</span>
        </div>
        <div className="flex items-center gap-2">
          <Slider
            value={[provider.priority]}
            min={1}
            max={10}
            step={1}
            onValueCommit={(value) => updatePriority(provider.id, value[0])}
            disabled={!provider.enabled}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => increasePriority(provider.id)}
              disabled={!provider.enabled || provider.priority === 1}
            >
              ↑
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => decreasePriority(provider.id)}
              disabled={!provider.enabled || provider.priority === 10}
            >
              ↓
            </Button>
          </div>
        </div>
        {provider.priority > 1 && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Fallback provider (used when priority {provider.priority - 1} fails)
          </p>
        )}
      </div>
      
      {/* Timeout & Retries */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Timeout</p>
          <p className="font-semibold">{provider.timeoutSeconds}s</p>
        </div>
        <div>
          <p className="text-muted-foreground">Max Retries</p>
          <p className="font-semibold">{provider.retryMaxAttempts}</p>
        </div>
      </div>
    </div>
    
    {/* Metrics Section */}
    <div className="rounded-lg border p-3 bg-gray-50">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Real-time Metrics
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Requests (Today)</p>
          <p className="text-xl font-bold">{provider.requestsToday?.toLocaleString() || '0'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Success Rate</p>
          <p className="text-xl font-bold text-green-600">
            {provider.successRate?.toFixed(1) || '0'}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg Latency</p>
          <p className="text-xl font-bold">{provider.avgLatency || 0}ms</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fallback Used</p>
          <p className="text-xl font-bold">{provider.fallbackCount || 0}</p>
        </div>
      </div>
      {provider.lastUsedAt && (
        <p className="text-xs text-muted-foreground mt-2">
          Last used: {formatRelativeTime(provider.lastUsedAt)}
        </p>
      )}
    </div>
    
    {/* Timestamps */}
    <div className="rounded-lg border p-3 bg-gray-50">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Timestamps
      </h4>
      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div>
          <p>Last sync</p>
          <p className="font-semibold text-foreground">{formatRelativeTime(provider.lastSyncAt)}</p>
        </div>
        <div>
          <p>Last health check</p>
          <p className="font-semibold text-foreground">
            {provider.enabled 
              ? formatRelativeTime(provider.lastHealthCheckAt) 
              : 'Never (disabled)'}
          </p>
        </div>
      </div>
    </div>
    
    {/* Actions */}
    <div className="grid grid-cols-3 gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => testProviderConnection(provider.id)}
      >
        <TestTube className="mr-2 h-4 w-4" />
        Test
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => viewProviderMetrics(provider.id)}
      >
        <BarChart3 className="mr-2 h-4 w-4" />
        Metrics
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => configureProvider(provider.id)}
      >
        <Settings className="mr-2 h-4 w-4" />
        Configure
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### **4. Provider Card (Disabled/Down)**

```tsx
<Card className="border-l-4 border-l-red-500 opacity-75">
  <CardHeader>
    {/* Similar header but with red/amber indicators */}
    <div className="flex items-center gap-2 text-red-600">
      <XCircle className="h-5 w-5" />
      <span className="text-sm font-medium">
        Provider down in MuleSoft - Cannot enable
      </span>
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4">
    {/* ... similar structure but with disabled controls ... */}
    
    {/* Enable button disabled with tooltip */}
    <div className="grid grid-cols-3 gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="cursor-not-allowed"
          >
            Enable
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Provider is down in MuleSoft</p>
          <p>Contact MuleSoft Team to resolve</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Other buttons... */}
    </div>
  </CardContent>
</Card>
```

---

## 🎯 Key Features

### **1. Enable/Disable Switch**
- ✅ **Visual:** Toggle switch on top-right of each card
- ✅ **Behavior:** 
  - ON → Provider available for routing + health checks active
  - OFF → Provider ignored + health checks paused
- ✅ **Disabled when:** MuleSoft status = `down`

### **2. Priority Slider**
- ✅ **Visual:** Horizontal slider 1-10
- ✅ **Behavior:** Lower number = higher priority (1 = primary)
- ✅ **Fallback indicator:** Shows ⚠️ when priority > 1
- ✅ **Disabled when:** Provider is disabled

### **3. Real-time Status Indicators**
- ✅ **MuleSoft Status:** 🟢 available | 🟡 configured | 🔴 down
- ✅ **Health Status:** 🟢 healthy (latency) | 🟡 degraded | 🔴 unhealthy
- ✅ **Auto-refresh:** Every 60 seconds

### **4. Metrics Display**
- ✅ **Requests Today:** Count from MuleSoft
- ✅ **Success Rate:** Percentage
- ✅ **Avg Latency:** Milliseconds
- ✅ **Fallback Count:** Times used as fallback

### **5. Actions**
- ✅ **Test:** Manual health check
- ✅ **Metrics:** Detailed metrics view
- ✅ **Configure:** Edit timeout/retries (future)

---

## 🎨 Color Scheme

### **Status Colors**

```tsx
// MuleSoft Status
const muleSoftStatusColors = {
  available: 'bg-green-50 text-green-700 border-green-200',
  configured: 'bg-blue-50 text-blue-700 border-blue-200',
  down: 'bg-red-50 text-red-700 border-red-200',
};

// Health Status
const healthStatusColors = {
  healthy: 'bg-green-50 text-green-700 border-green-200',
  unhealthy: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-gray-50 text-gray-700 border-gray-200',
};

// Provider Type
const providerTypeColors = {
  SMS: 'bg-blue-500/10 text-blue-700 border-blue-200',
  PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200',
  VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200',
  BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200',
};

// Priority Indicator
const priorityColor = (priority: number) => {
  if (priority === 1) return 'text-green-600'; // Primary
  if (priority <= 3) return 'text-yellow-600'; // First fallback
  return 'text-gray-600'; // Deep fallback
};
```

---

## 📱 Responsive Design

### **Desktop (> 1024px)**
- 2-column grid for provider cards
- Full sidebar visible
- All metrics visible

### **Tablet (768px - 1024px)**
- 1-column grid for provider cards
- Collapsible sidebar
- Metrics in 2x2 grid

### **Mobile (< 768px)**
- 1-column grid
- Stacked metrics (1 column)
- Simplified header
- Hamburger menu

---

## 🔄 Auto-refresh & Sync

### **Automatic Sync**
```tsx
// Sync every 5 minutes
useEffect(() => {
  const interval = setInterval(() => {
    syncFromMuleSoft();
  }, 300000); // 5 min
  
  return () => clearInterval(interval);
}, []);
```

### **Health Check Refresh**
```tsx
// Refresh health status every 60 seconds
useEffect(() => {
  const interval = setInterval(() => {
    refreshHealthStatus();
  }, 60000); // 1 min
  
  return () => clearInterval(interval);
}, []);
```

---

## 🧪 Interactive States

### **Loading State**
```tsx
<Card className="animate-pulse">
  <CardHeader>
    <div className="h-6 bg-gray-200 rounded w-1/3" />
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  </CardContent>
</Card>
```

### **Error State**
```tsx
<Card className="border-red-200 bg-red-50/30">
  <CardContent className="pt-6">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <div>
        <h3 className="font-semibold text-red-900">
          Failed to sync from MuleSoft
        </h3>
        <p className="text-sm text-red-700 mt-1">
          Connection timeout. Retry in 30 seconds...
        </p>
        <Button variant="outline" size="sm" className="mt-2">
          Retry Now
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### **Empty State**
```tsx
<Card>
  <CardContent className="pt-12 pb-12 text-center">
    <Server className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
    <h3 className="text-lg font-semibold mb-2">
      No providers found
    </h3>
    <p className="text-muted-foreground mb-4">
      No providers are configured in MuleSoft yet
    </p>
    <Button onClick={syncFromMuleSoft}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Sync from MuleSoft
    </Button>
  </CardContent>
</Card>
```

---

## 🔔 Toast Notifications

### **Success**
```tsx
toast({
  title: '✅ Provider Enabled',
  description: 'Twilio SMS España is now active for routing',
});
```

### **Warning**
```tsx
toast({
  title: '⚠️ Priority Changed',
  description: 'AWS SNS España is now fallback provider (priority 2)',
  variant: 'warning',
});
```

### **Error**
```tsx
toast({
  title: '❌ Cannot Enable Provider',
  description: 'Provider is down in MuleSoft. Contact MuleSoft Team.',
  variant: 'destructive',
});
```

---

**Documento creado:** 5 de diciembre de 2025  
**Última actualización:** 5 de diciembre de 2025  
**Owner:** Frontend Team  
**Status:** 📋 Design Ready for Implementation
