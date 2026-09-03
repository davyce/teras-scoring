import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-6">
          <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-10 max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Une erreur est survenue</h2>
              <p className="text-slate-400 text-sm">
                Un problème inattendu a bloqué cette page. Vos données sont intactes.
              </p>
              {this.state.error?.message && (
                <p className="mt-3 px-3 py-2 bg-slate-800/60 rounded-xl text-xs text-rose-300 font-mono break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.reset}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-colors">
                <RefreshCw className="w-4 h-4" /> Réessayer
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">
                Accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
