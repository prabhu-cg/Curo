import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Curo encountered an unexpected error:', error, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ error: null });
    window.location.reload();
  };

  override render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertTriangle className="text-destructive size-10" aria-hidden="true" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-md text-sm text-[#555555]">
            Curo hit an unexpected error. Your bookmarks are safe in local storage.
            Reloading usually fixes this.
          </p>
        </div>
        <Button onClick={this.handleReload}>Reload Curo</Button>
      </div>
    );
  }
}
