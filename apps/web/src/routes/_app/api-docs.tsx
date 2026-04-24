import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const Route = createFileRoute('/_app/api-docs')({
  component: ApiDocsPage,
})

const BASE = 'https://api.theprimeway.com'

const endpoints: Array<{
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  summary: string
  auth: 'api-key' | 'jwt'
}> = [
  { method: 'GET', path: '/api/tasks', summary: 'List your tasks', auth: 'api-key' },
  { method: 'POST', path: '/api/tasks', summary: 'Create a task (capture)', auth: 'api-key' },
  { method: 'PATCH', path: '/api/tasks/:id', summary: 'Update a task (e.g. mark completed)', auth: 'api-key' },
  { method: 'GET', path: '/api/goals', summary: 'List your goals', auth: 'api-key' },
  { method: 'GET', path: '/api/rituals/today', summary: 'Today\'s pending rituals', auth: 'api-key' },
]

const events: Array<{ name: string; description: string }> = [
  { name: 'task.completed', description: 'Fired when a task transitions to completed' },
  { name: 'task.created', description: 'Fired on new task creation' },
  { name: 'task.updated', description: 'Fired on task updates (title, schedule, etc.)' },
  { name: 'goal.completed', description: 'Fired when a goal status flips to ACHIEVED' },
]

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  POST: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  PATCH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  DELETE: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
}

function Code({ children }: { children: string }) {
  return (
    <pre className="rounded-md bg-muted/70 p-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-all">
      {children}
    </pre>
  )
}

function ApiDocsPage() {
  return (
    <div>
      <SectionHeader sectionId="api-docs" title="API & Webhooks" />
      <div className="mx-auto max-w-3xl px-6 pb-10 space-y-6">
        {/* Intro */}
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold">Public API</h2>
            <p className="text-sm text-muted-foreground">
              Use an API key to call The Primeway from scripts, Zapier, Make, or custom integrations.
              Keys are created in <a href="/settings" className="underline">Settings</a> and shown exactly once.
            </p>
            <div className="text-xs text-muted-foreground">
              Base URL: <code className="font-mono text-foreground">{BASE}</code>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold">Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Send your key in the <code className="font-mono">X-API-Key</code> header, or as a Bearer token.
              Keys start with <code className="font-mono">pk_live_</code>.
            </p>
            <Code>{`curl ${BASE}/api/tasks \\
  -H "X-API-Key: pk_live_…"

# or
curl ${BASE}/api/tasks \\
  -H "Authorization: Bearer pk_live_…"`}</Code>
            <p className="text-xs text-muted-foreground">
              Invalid or revoked keys return <code className="font-mono">401 Unauthorized</code>. Revoked keys cannot be re-enabled — create a new one.
            </p>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold">Common endpoints</h3>
            <p className="text-xs text-muted-foreground">
              Every surface of The Primeway is available via the same REST API the web app uses. Below are the most useful
              for integrations. Full OpenAPI schema at <code className="font-mono">{BASE}/api/doc</code>.
            </p>
            <div className="divide-y divide-border/40 rounded-md border border-border/40 overflow-hidden">
              {endpoints.map((e) => (
                <div key={`${e.method}-${e.path}`} className="flex items-start gap-3 p-2.5">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${METHOD_COLOR[e.method]}`}>
                    {e.method}
                  </span>
                  <div className="min-w-0 flex-1">
                    <code className="text-xs font-mono">{e.path}</code>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{e.summary}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold">Webhooks</h3>
            <p className="text-sm text-muted-foreground">
              Receive HTTP POST notifications when events happen. Register endpoints in <a href="/settings" className="underline">Settings</a> and
              choose the events you want.
            </p>

            <h4 className="text-sm font-medium mt-2">Events</h4>
            <div className="space-y-1.5">
              {events.map((e) => (
                <div key={e.name} className="flex items-start gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">{e.name}</Badge>
                  <span className="text-xs text-muted-foreground">{e.description}</span>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-medium mt-3">Payload</h4>
            <Code>{`POST https://your-endpoint.com/hook
Content-Type: application/json
X-Primeway-Event: task.completed
X-Primeway-Signature: sha256=<hex>
User-Agent: theprimeway-webhooks/1.0

{
  "event": "task.completed",
  "occurredAt": "2026-04-24T14:12:03.000Z",
  "data": {
    "id": "...",
    "title": "Write Q2 architecture doc",
    "completedAt": "2026-04-24T14:12:03.000Z",
    "priority": "high",
    "weeklyGoalId": "..."
  }
}`}</Code>

            <h4 className="text-sm font-medium mt-3">Verifying signatures</h4>
            <p className="text-sm text-muted-foreground">
              Every request is signed with HMAC-SHA256 using the webhook's signing secret (shown once in Settings).
              Compare the <code className="font-mono">X-Primeway-Signature</code> header against your own HMAC of the raw body:
            </p>
            <Code>{`// Node.js
import crypto from 'node:crypto'

function verify(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader),
  )
}`}</Code>
            <p className="text-xs text-muted-foreground">
              Delivery is fire-and-forget with a 5-second timeout. Non-2xx responses are recorded in Settings as the
              <code className="font-mono">last delivery</code> code but are not retried automatically.
            </p>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardContent className="space-y-2">
            <h3 className="text-base font-semibold">Limits &amp; notes</h3>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>API keys are scoped to a single user — no team-level keys yet.</li>
              <li>Every request counts toward your plan's rate limit (published once we finalize tiers).</li>
              <li>Revoking a key is immediate and cannot be undone. Create a new key instead of sharing one.</li>
              <li>Webhook secrets are shown on creation and remain visible in Settings to support signature verification — never expose them publicly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
