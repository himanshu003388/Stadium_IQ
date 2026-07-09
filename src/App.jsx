import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

function App() {
  return (
    <ErrorBoundary>
      <Layout />
    </ErrorBoundary>
  );
}

export default App;
