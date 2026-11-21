import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import { RequireRole } from "@/auth/RequireRole";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CentreBatchPage } from "@/pages/CentreBatchPage";
import { CentreHomePage } from "@/pages/CentreHomePage";
import { HomePage } from "@/pages/HomePage";
import { OfficerHomePage } from "@/pages/OfficerHomePage";
import { QualityHomePage } from "@/pages/QualityHomePage";
import { StateHomePage } from "@/pages/StateHomePage";
import { VerifyPage } from "@/pages/VerifyPage";

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="verify" element={<VerifyPage />} />
            <Route
              path="centre"
              element={
                <RequireRole roles={["CENTRE"]}>
                  <CentreHomePage />
                </RequireRole>
              }
            />
            <Route
              path="centre/batches/:id"
              element={
                <RequireRole roles={["CENTRE"]}>
                  <CentreBatchPage />
                </RequireRole>
              }
            />
              <Route
                path="officer"
                element={
                  <RequireRole roles={["DISTRICT"]}>
                    <OfficerHomePage />
                  </RequireRole>
                }
              />
              <Route
                path="quality"
                element={
                  <RequireRole roles={["QUALITY"]}>
                    <QualityHomePage />
                  </RequireRole>
                }
              />
              <Route
                path="state"
                element={
                  <RequireRole roles={["STATE"]}>
                    <StateHomePage />
                  </RequireRole>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster richColors closeButton position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}
