# Feature Flags System

## Overview

ThePrimeWay uses a **server-driven feature flags system** that controls which features each user has access to based on three criteria:

1. **Subscription Plan** — Free, Trial, or Premium tier
2. **App Version** — Minimum version requirements (e.g., v2.0+)
3. **Admin Overrides** — Manual enable/disable per user (e.g., beta testing, support cases)

The **server is the single source of truth**. Clients never decide if a feature is enabled; they receive a pre-computed feature set and render accordingly.

---

## Architecture

### Three-Layer Resolution

When a user requests their features, the system applies these layers in order:

```
Plan Defaults  →  Version Gates  →  User Overrides
    (lowest)                           (highest)
```

**Example:**
- **Plan default:** `AI_ASSISTANT = false` (Free plan doesn't include it)
- **Version gate:** App is v1.9, minimum is v2.0 → force off
- **Override:** Admin enables it for this user → **enabled** ✓

---

## Database Schema

### `UserFeatureOverride` Table

Stores manual enable/disable decisions per user:

```sql
CREATE TABLE user_feature_overrides (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL,
  feature_key VARCHAR NOT NULL,
  enabled    BOOLEAN NOT NULL,
  reason     VARCHAR,           -- "beta testing", "support request", etc.
  created_by VARCHAR,           -- Admin user ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, feature_key)
);
```

### `User` Table Addition

```sql
ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user';
-- Values: 'user' | 'admin'
```

### Feature Registry

Defined in `packages/shared/src/constants/features.ts`:

```typescript
export const FEATURES = {
  // Module-specific gates (free users don't have access)
  AI_ASSISTANT: 'AI_ASSISTANT',
  BRAIN_MODULE: 'BRAIN_MODULE',

  // Transversal features (applies to multiple modules)
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  CUSTOM_THEME_CREATION: 'CUSTOM_THEME_CREATION',  // Ability to create custom themes
  CUSTOM_THEMES: 'CUSTOM_THEMES',
  EXPORT_DATA: 'EXPORT_DATA',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',

  // Numeric limit gates (the gate fires when usage hits the cap)
  HABITS_LIMIT: 'HABITS_LIMIT',      // -1 = unlimited
  GOALS_LIMIT: 'GOALS_LIMIT',
  TASKS_LIMIT: 'TASKS_LIMIT',
  POMODORO_DAILY_LIMIT: 'POMODORO_DAILY_LIMIT',
  BRAIN_ENTRIES_LIMIT: 'BRAIN_ENTRIES_LIMIT',
};
```

**Module Gates:**
- `AI_ASSISTANT` — Entire AI Assistant module (/ai)
- `BRAIN_MODULE` — Second Brain module (/brain)

**Transversal Features:**
- `ADVANCED_ANALYTICS` — Analytics features across all modules
- `CUSTOM_THEME_CREATION` — Ability to create custom themes (light/dark is always free)
- `EXPORT_DATA` — Data export functionality
- `PRIORITY_SUPPORT` — Priority support access

---

## Backend: Feature Resolution

### 1. Feature Service (`apps/api/src/services/features.service.ts`)

```typescript
async resolveFeatures(userId: string, appVersion?: string): ResolvedFeatureSet {
  // Step 1: Get subscription plan
  const subscription = await this.getSubscription(userId);
  const plan = subscription?.plan;
  
  // Step 2: Apply plan defaults
  let features = this.applyPlanDefaults(plan);
  
  // Step 3: Apply version gates
  if (appVersion) {
    features = this.applyVersionGates(features, appVersion);
  }
  
  // Step 4: Apply user overrides (highest priority)
  const overrides = await this.getUserOverrides(userId);
  features = this.applyOverrides(features, overrides);
  
  return features;
}
```

**Response Format:**
```typescript
interface ResolvedFeatureSet {
  AI_ASSISTANT: {
    enabled: boolean;
    reason?: 'plan' | 'version' | 'override';
  };
  TASKS_LIMIT: {
    enabled: boolean;
    limit: number;  // Max tasks user can create (-1 = unlimited)
    reason?: string;
  };
  // ... more features
}
```

### 2. API Endpoints

#### GET `/api/features`
Returns the resolved feature set for the authenticated user.

**Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
     -H "X-App-Version: 2.0.1" \
     https://api.theprimeway.com/api/features
```

**Response:**
```json
{
  "data": {
    "AI_ASSISTANT": { "enabled": true, "reason": "plan" },
    "CUSTOM_THEMES": { "enabled": false, "reason": "plan" },
    "TASKS_LIMIT": { "enabled": true, "limit": -1, "reason": "plan" }
  },
  "resolvedAt": "2026-04-11T15:30:00Z"
}
```

#### PUT `/api/admin/users/:userId/features/:featureKey`
Admin endpoint to manually enable/disable a feature for a user.

**Request (admin only):**
```bash
curl -X PUT \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "reason": "beta testing"}' \
  https://api.theprimeway.com/api/admin/users/user-123/features/AI_ASSISTANT
```

**Response:**
```json
{
  "userId": "user-123",
  "featureKey": "AI_ASSISTANT",
  "enabled": true,
  "reason": "beta testing"
}
```

#### DELETE `/api/admin/users/:userId/features/:featureKey`
Remove a manual override, reverting to plan defaults.

**Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  https://api.theprimeway.com/api/admin/users/user-123/features/AI_ASSISTANT
```

### 3. Feature Gate Middleware

Protects API endpoints that require specific features:

```typescript
chatRoutes.use('*', requireFeature(FEATURES.AI_ASSISTANT))
```

Returns **403 Forbidden** if the feature is not enabled:
```json
{
  "error": "Feature not available",
  "feature": "AI_ASSISTANT"
}
```

### 4. Limit Enforcement

For limit-type features (TASKS_LIMIT, HABITS_LIMIT, etc.), services validate **before creation**:

```typescript
// apps/api/src/services/tasks.service.ts
async createTask(userId: string, input: CreateTaskInput) {
  const [subscription, usage] = await Promise.all([
    // fetch subscription plan
    // fetch current usage count
  ]);
  
  // Throws LimitExceededError if limit exceeded
  validateLimit(FEATURES.TASKS_LIMIT, plan, usage.currentTasks);
  
  // Create task...
}
```

Returns **409 Conflict** if limit exceeded:
```json
{
  "error": "You have reached your task limit for this plan.",
  "limitType": "TASKS_LIMIT"
}
```

---

## Frontend: Web App (`apps/web`)

### 1. Feature Store (Zustand)

Caches the resolved feature set locally with localStorage persistence:

```typescript
// apps/web/src/stores/features.store.ts
const useFeatureStore = create<FeaturesState>()(
  persist(
    (set) => ({
      features: null,
      resolvedAt: null,
      setFeatures: (features, resolvedAt) => set({ features, resolvedAt }),
      clearFeatures: () => set({ features: null, resolvedAt: null }),
    }),
    {
      name: 'theprimeway-features',  // localStorage key
    }
  )
);
```

### 2. TanStack Query Hook

Fetches features with 30-minute stale time:

```typescript
// apps/web/src/features/feature-flags/hooks.ts
export function useFeatures() {
  const store = useFeatureStore();
  const { data: features, isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: () => featuresApi.getFeatures(),
    staleTime: 30 * 60 * 1000,  // 30 minutes
  });

  // Sync to store on success
  useEffect(() => {
    if (features?.data) {
      store.setFeatures(features.data, features.resolvedAt);
    }
  }, [features?.data]);

  // Return store cache if offline
  return features?.data ?? store.features;
}

export function useFeature(key: FeatureKey) {
  const features = useFeatures();
  return features?.[key] ?? { enabled: false, isLoading: true };
}
```

### 3. FeatureGate Component

Conditionally renders children based on feature availability:

```typescript
// apps/web/src/features/feature-flags/FeatureGate.tsx
export function FeatureGate({ feature, fallback, children }) {
  const { enabled, isLoading } = useFeature(feature);

  if (isLoading && !enabled) {
    // Optimistic render: show children during loading
    // (stale cache is likely available)
    return <>{children}</>;
  }

  if (!enabled) {
    return fallback || null;
  }

  return <>{children}</>;
}
```

**Usage in Routes:**
```typescript
// apps/web/src/routes/_app/ai.tsx
export const Route = createFileRoute('/_app/ai')({
  component: AiPage,
});

function AiPage() {
  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <AiPageContent />
    </FeatureGate>
  );
}
```

### 4. Navigation Filtering

The sidebar filters nav items based on feature availability:

```typescript
// apps/web/src/components/layout/sidebar.tsx
function useVisibleNavItems() {
  const navItems = useNavItems();
  const { features } = useFeatures();

  return navItems.filter((item) => {
    if (!item.requiredFeature) return true;
    return features?.[item.requiredFeature]?.enabled ?? false;
  });
}
```

**Nav Item Definition:**
```typescript
interface NavItem {
  title: string;
  to: string;
  icon: React.ReactNode;
  requiredFeature?: FeatureKey;  // Optional: hide if not enabled
}

const navItems: NavItem[] = [
  // ... other items
  {
    title: 'AI Assistant',
    to: '/ai',
    icon: sparklesIcon,
    requiredFeature: FEATURES.AI_ASSISTANT,  // Hidden for Free users
  },
];
```

### 5. Settings Page

Shows/hides settings sections conditionally:

```typescript
// apps/web/src/routes/_app/settings.tsx
function SettingsPage() {
  const { t } = useTranslation('settings');
  const customThemesFeature = useFeature(FEATURES.CUSTOM_THEMES);
  const exportDataFeature = useFeature(FEATURES.EXPORT_DATA);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h2>{t('title')}</h2>

      {/* Only show if Premium */}
      {customThemesFeature.enabled ? (
        <PreferencesForm />
      ) : (
        <div className="text-sm text-muted-foreground p-4">
          {t('customThemesLocked')}
        </div>
      )}

      {/* Only show if Premium */}
      {exportDataFeature.enabled && <DangerZone />}
    </div>
  );
}
```

### 6. Upgrade Prompt Fallback

Shown when a feature is locked:

```typescript
// apps/web/src/features/subscriptions/components/upgrade-prompt.tsx
export function UpgradePrompt({ featureKey }) {
  const message = featureMessages[featureKey];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{message.title}</CardTitle>
        <CardDescription>{message.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to="/subscription">
          <Button>Upgrade to Premium</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

---

## Mobile: Expo App (`apps/mobile`)

### 1. Feature Store (SecureStore)

Persists features securely using `SecureStore` (encrypted):

```typescript
// apps/mobile/src/shared/stores/featuresStore.ts
const useFeaturesStore = create<FeaturesState>()((set) => ({
  features: null,
  resolvedAt: null,
  
  loadStoredFeatures: async () => {
    const stored = await SecureStore.getItemAsync('feature_set');
    if (stored) {
      const { features, resolvedAt } = JSON.parse(stored);
      set({ features, resolvedAt });
    }
  },
  
  setFeatures: async (features, resolvedAt) => {
    await SecureStore.setItemAsync(
      'feature_set',
      JSON.stringify({ features, resolvedAt })
    );
    set({ features, resolvedAt });
  },
}));
```

### 2. Feature Fetching

On app startup (`AuthProvider`), loads stored features for offline access:

```typescript
// apps/mobile/src/shared/providers/AuthProvider.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const loadStoredFeatures = useFeaturesStore((s) => s.loadStoredFeatures);

  useEffect(() => {
    loadStoredFeatures();  // Bootstrap from SecureStore
  }, []);

  return <>{children}</>;
}
```

### 3. FeatureGate Component

React Native version:

```typescript
// apps/mobile/src/features/feature-flags/FeatureGate.tsx
export function FeatureGate({ feature, fallback, children }) {
  const { enabled } = useFeature(feature);

  if (!enabled) {
    return fallback || null;
  }

  return <>{children}</>;
}
```

### 4. Protected Screens

Example: AI Chat Screen

```typescript
// apps/mobile/app/(app)/ai.tsx
function AiChatScreenContent() {
  // Chat UI...
}

export default function AiChatScreen() {
  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <AiChatScreenContent />
    </FeatureGate>
  );
}
```

---

## How to Enable/Disable Features for Users

### Option 1: By Plan (Server-Side)

Edit `SubscriptionPlan` fields in database:

```sql
UPDATE subscription_plans
SET hasAiAssistant = true, maxHabits = 50
WHERE name = 'premium';
```

Then users on Premium plan automatically get these features.

### Option 2: Admin Override (API)

Enable a feature for a specific user (bypasses plan restrictions):

```bash
curl -X PUT \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"enabled": true, "reason": "beta testing"}' \
  https://api.theprimeway.com/api/admin/users/user-123/features/AI_ASSISTANT
```

### Option 3: Version Gate (Code)

Require a minimum app version in `packages/shared/src/constants/features.ts`:

```typescript
export const VERSION_GATES: Partial<Record<FeatureKey, string>> = {
  ADVANCED_ANALYTICS: '2.0.0',  // Only available in v2.0+
};
```

Users on v1.9 won't see it; users on v2.0+ will.

---

## Flow Diagram

### User Logs In

```
1. User sends auth request with password
   ↓
2. Server creates JWT token (no features info)
   ↓
3. Client makes GET /api/features with token + X-App-Version header
   ↓
4. Server resolves features (3-layer: plan → version → override)
   ↓
5. Client receives { AI_ASSISTANT: { enabled: true }, ... }
   ↓
6. Client caches in localStorage/SecureStore
   ↓
7. UI renders based on enabled features
```

### Creating a Task (with Limit)

```
1. User clicks "Create Task"
   ↓
2. Client sends POST /api/tasks { title: "..." }
   ↓
3. Server:
   - Gets user's subscription plan
   - Gets current usage count (currentTasks)
   - Validates: currentTasks < plan.maxTasks
   ↓
4a. If valid: Create task, increment currentTasks
    Response: 201 Created
    ↓
4b. If limit exceeded: 
    Response: 409 Conflict
    { error: "Task limit reached", limitType: "TASKS_LIMIT" }
    ↓
5. Client shows error or success toast
```

---

## Caching Strategy

| Layer | TTL | Offline Support |
|-------|-----|-----------------|
| API (`GET /api/features`) | First request cached by TanStack Query | ✓ Zustand/SecureStore fallback |
| TanStack Query (web) | 30 minutes (stale time) | ✓ Cache persists |
| Zustand/SecureStore | Infinite (persisted) | ✓ Full offline |
| Database (server-side cache) | 60 seconds (in-process Map) | Refreshed on subscription change |

**Key insight:** Even offline, users see their last-known features. When back online, the 30-min stale window means no re-fetch unless explicitly invalidated.

---

## Testing

### Test: Feature Gate Blocks Access

```typescript
it('blocks AI chat for users without AI_ASSISTANT', () => {
  // Mock feature store
  useFeaturesStore.setState({
    features: { AI_ASSISTANT: { enabled: false } },
  });

  render(
    <FeatureGate feature={FEATURES.AI_ASSISTANT} fallback={<div>Locked</div>}>
      <div>Chat</div>
    </FeatureGate>
  );

  expect(screen.getByText('Locked')).toBeInTheDocument();
  expect(screen.queryByText('Chat')).not.toBeInTheDocument();
});
```

### Test: Limit Enforcement

```typescript
it('returns 409 when task limit exceeded', async () => {
  // Create user with Free plan (maxTasks = 5)
  // Create 5 tasks
  
  const response = await client.post('/api/tasks', {
    title: 'Task 6',
  });

  expect(response.status).toBe(409);
  expect(response.body.limitType).toBe('TASKS_LIMIT');
});
```

---

## Summary

| Component | Purpose | Behavior |
|-----------|---------|----------|
| **Feature Registry** | Single source of feature names | Never changes at runtime |
| **SubscriptionPlan** | Map plan tier → features | Admin edits to enable for tier |
| **UserFeatureOverride** | Manual per-user toggles | Admin overrides plan defaults |
| **FeaturesService** | Resolves feature set | 3-layer: plan → version → override |
| **GET /api/features** | Client fetches resolved features | Includes version in X-App-Version header |
| **FeatureGate Component** | Renders conditionally | Shows children or fallback |
| **requireFeature Middleware** | API endpoint protection | Returns 403 if not enabled |
| **validateLimit** | Prevents exceeding quotas | Returns 409 if limit exceeded |

**Rule of thumb:** The server decides everything. The client never guesses whether a feature is available—it always asks first and renders what the server says.
