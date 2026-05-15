import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-[2rem] border border-brand-ink/5 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-brand-ink mb-2">
            {this.props.fallbackTitle || 'Ocorreu um erro ao carregar esta tela'}
          </h2>
          <p className="text-brand-ink/60 mb-8 max-w-sm">
            {this.props.fallbackMessage || 'Houve um problema inesperado. Por favor, tente atualizar a página ou entrar novamente.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-14 px-8 bg-brand-ink text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="uppercase text-xs tracking-widest font-bold">Atualizar Página</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
