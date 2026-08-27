import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Taj PMS ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleResetStorage = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0B0F14',
          color: '#F2EFE6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '440px',
            background: '#121826',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>🛎️</div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '8px'
            }}>Taj Residency Reception Terminal</h1>
            <p style={{
              fontSize: '13px',
              color: '#94A3B8',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              A display or state refresh is needed to synchronize your front desk session.
            </p>
            {this.state.error?.message && (
              <div style={{
                textAlign: 'left',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                marginBottom: '16px',
                wordBreak: 'break-all'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#C9A24B',
                  color: '#0B0F14',
                  fontWeight: '600',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Reload Reception Desk
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#94A3B8',
                  fontWeight: '500',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear Local Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

