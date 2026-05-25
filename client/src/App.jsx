import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useApp } from './context/AppContext.jsx';
import { ROLE_PERMISSIONS } from './data/constants.js';
import ColdRoom from './pages/ColdRoom.jsx';
import Collection from './pages/Collection.jsx';
import Complaints from './pages/Complaints.jsx';
import Credit from './pages/Credit.jsx';
import Customers from './pages/Customers.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Grading from './pages/Grading.jsx';
import Loss from './pages/Loss.jsx';
import Weighing from './pages/Weighing.jsx';

function ProtectedRoute({ children, permission }) {
  const { currentUser } = useApp();
  const hasPermission = ROLE_PERMISSIONS[currentUser.role]?.includes(permission);

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/weighing"
          element={
            <ProtectedRoute permission="weighing">
              <Weighing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coldroom"
          element={
            <ProtectedRoute permission="coldroom">
              <ColdRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grading"
          element={
            <ProtectedRoute permission="grading">
              <Grading />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute permission="customers">
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit"
          element={
            <ProtectedRoute permission="credit">
              <Credit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collection"
          element={
            <ProtectedRoute permission="collection">
              <Collection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loss"
          element={
            <ProtectedRoute permission="loss">
              <Loss />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <ProtectedRoute permission="complaints">
              <Complaints />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}
