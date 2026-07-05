import { AlertTriangle } from 'lucide-react'

export function LoadError({ title, message }: { title: string; message?: string }) {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-card border rounded-xl p-6 shadow-sm flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The data could not be loaded from the database. Refresh the page to retry.
          </p>
          {message && (
            <p className="text-xs font-mono text-muted-foreground mt-3 break-all">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
