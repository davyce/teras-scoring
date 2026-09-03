/**
 * Composant racine de l'application
 * @module App
 */

import "./globals.css";
import AppRoutes from "./routes/AppRoutes";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
