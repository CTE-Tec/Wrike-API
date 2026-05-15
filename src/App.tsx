import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastArea from './components/Toast';
import Dashboard from './pages/Dashboard';
import Faturamento from './pages/Faturamento';
import Inbox from './pages/Inbox';
import MyTasks from './pages/MyTasks';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Search from './pages/Search';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/faturamento" element={<Faturamento />} />
          <Route path="/projects/:folder" element={<Projects />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastArea />
      </div>
    </BrowserRouter>
  );
}

export default App;
