import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { LoginForm } from './components/auth/LoginForm';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugInfo } from './components/DebugInfo';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </AuthProvider>
          <DebugInfo />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 