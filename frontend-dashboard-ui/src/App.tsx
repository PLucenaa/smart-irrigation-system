import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';

/**
 * Componente principal da aplicação.
 */
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Dashboard />
    </div>
  );
}

export default App;

