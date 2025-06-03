import React, { useState, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import App from './App';

// Custom ErrorBoundary component
class ErrorBoundary extends Component<{
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}> {
  state = { hasError: false, error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DebugWrapper = () => {
  const [showEnvTest, setShowEnvTest] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if environment variables are set
  const envVars = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? 'Set' : 'Not Set'
  };

  const missingEnvVars = Object.entries(envVars).filter(([_, value]) => value === 'Not Set');
  
  return (
    <div>
      {missingEnvVars.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          padding: '10px', 
          background: '#ffeeee', 
          color: '#cc0000', 
          zIndex: 9999,
          textAlign: 'center',
          fontFamily: 'monospace'
        }}>
          <strong>Missing Environment Variables:</strong> {missingEnvVars.map(([key]) => key).join(', ')}
          <div>
            <small>
              Please create a .env file with the required variables from .env.example
            </small>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: missingEnvVars.length > 0 ? '60px' : '0' }}>
        <button 
          onClick={() => setShowEnvTest(!showEnvTest)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '8px 12px',
            background: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showEnvTest ? 'Hide Env Info' : 'Show Env Info'}
        </button>
        
        {showEnvTest && (
          <div style={{ 
            position: 'fixed', 
            bottom: '70px', 
            right: '20px', 
            background: 'white', 
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            maxWidth: '400px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 9998
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Environment Variables</h3>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              margin: 0
            }}>
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </div>
        )}
        
        <ErrorBoundary
          fallback={
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <h1>Something went wrong</h1>
              <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
                {error?.toString()}
              </pre>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '15px',
                  padding: '8px 16px',
                  background: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          }
          onError={(error: Error) => setError(error)}
        >
          <App />
        </ErrorBoundary>
      </div>
    </div>
  );
};



export default DebugWrapper;
