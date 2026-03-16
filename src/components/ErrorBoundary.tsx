import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 512, background: "#fff", border: "2px solid #dc2626", borderRadius: 12, padding: 24 }}>
            <h1 style={{ fontSize: 18, fontWeight: "bold", color: "#dc2626", marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#1f2937", marginBottom: 12 }}>{this.state.error.message}</p>
            <pre style={{ fontSize: 11, overflow: "auto", background: "#f3f4f6", padding: 16, borderRadius: 8, color: "#374151", maxHeight: 200 }}>
              {this.state.error.stack}
            </pre>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ marginTop: 16, padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
