import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Button } from '@/components/ui/button';

export function RouteError() {
  const error = useRouteError();
  // A new deploy invalidates old lazy chunks; reloading picks up the new ones.
  const isChunkError =
    error instanceof Error && /dynamically imported module|Failed to fetch/i.test(error.message);

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-primary">
          {isRouteErrorResponse(error) ? error.status : 'Oops'}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {isChunkError ? 'A new version is available' : 'Something went wrong'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isChunkError
            ? 'Reload the page to get the latest version of Spendly.'
            : 'An unexpected error occurred. Try again, or head back to the dashboard.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
