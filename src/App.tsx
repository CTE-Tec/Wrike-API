import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastArea from './components/Toast';
import Faturamento from './views/Faturamento';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/faturamento" replace />} />
          <Route path="/faturamento" element={<Faturamento />} />
          <Route path="*" element={<Navigate to="/faturamento" replace />} />
        </Routes>
        <ToastArea />
      </div>
    </BrowserRouter>
  );
}

export default App;
