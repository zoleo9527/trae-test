import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import LedgerList from "@/pages/LedgerList";
import LedgerDetail from "@/pages/LedgerDetail";
import ExceptionList from "@/pages/ExceptionList";
import ExceptionDetail from "@/pages/ExceptionDetail";
import PriceAdjustment from "@/pages/PriceAdjustment";
import FinanceSettlement from "@/pages/FinanceSettlement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ledger" element={<LedgerList />} />
          <Route path="/ledger/:id" element={<LedgerDetail />} />
          <Route path="/exceptions" element={<ExceptionList />} />
          <Route path="/exceptions/:id" element={<ExceptionDetail />} />
          <Route path="/prices" element={<PriceAdjustment />} />
          <Route path="/finance" element={<FinanceSettlement />} />
        </Route>
      </Routes>
    </Router>
  );
}
