// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unknown runtime error',
    };
  }

  componentDidCatch(error, info) {
    console.error('Runtime render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-xl w-full rounded-xl border border-red-200 bg-white p-6 shadow">
            <h1 className="text-xl font-semibold text-red-700">App crashed during render</h1>
            <p className="mt-2 text-sm text-gray-700">Open browser console to see the detailed error and stack trace.</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-800">
              {this.state.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppBootLoader = () => {
  const [LoadedApp, setLoadedApp] = React.useState(null);
  const [bootError, setBootError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;

    import('./App')
      .then((mod) => {
        if (!mounted) return;
        setLoadedApp(() => mod.default);
      })
      .catch((error) => {
        console.error('Failed to import App module:', error);
        if (!mounted) return;
        setBootError(error?.message || 'Failed to import App module');
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (bootError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#f8fafc' }}>
        <div style={{ maxWidth: 760, width: '100%', background: '#fff', border: '1px solid #fecaca', borderRadius: 12, padding: 20 }}>
          <h1 style={{ margin: 0, color: '#b91c1c', fontSize: 22 }}>App failed during startup import</h1>
          <p style={{ marginTop: 8, color: '#374151' }}>A module import crashed before React could render the app.</p>
          <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8 }}>{bootError}</pre>
        </div>
      </div>
    );
  }

  if (!LoadedApp) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
        Booting FarmGuard...
      </div>
    );
  }

  return <LoadedApp />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppBootLoader />
    </AppErrorBoundary>
  </React.StrictMode>
);
