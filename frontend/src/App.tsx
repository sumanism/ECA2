import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Segments from './pages/Segments';
import Flows from './pages/Flows';
import Campaigns from './pages/Campaigns';
import Agent from './pages/Agent';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/segments" element={<Segments />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/agent" element={<Agent />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
