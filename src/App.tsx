import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { NotetakerPage } from './pages/NotetakerPage';
import { ClientsPage } from './pages/ClientsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/notetaker" element={<NotetakerPage />} />
          <Route path="/clients" element={<ClientsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
