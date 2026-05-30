import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProcessingPanel from '@/components/ProcessingPanel';
import Home from '@/pages/Home';
import Pipeline from '@/pages/Pipeline';
import Batches from '@/pages/Batches';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/batches" element={<Batches />} />
        </Route>
      </Routes>
      <ProcessingPanel />
    </Router>
  );
}
