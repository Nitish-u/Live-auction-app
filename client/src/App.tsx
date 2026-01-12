import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { ExploreAuctions } from "./pages/ExploreAuctions";
import { AuctionDetails } from "./pages/AuctionDetails";
import { AssetGallery } from "./pages/AssetGallery";
import { SellerAssets } from "./pages/SellerAssets";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";
import PublicProfile from "./pages/PublicProfile";
import MyProfile from "./pages/MyProfile";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import Settings from "./pages/Settings";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { CreateAssetPage } from "@/pages/CreateAssetPage";
import { ScheduleAuctionPage } from "@/pages/ScheduleAuctionPage";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<ExploreAuctions />} />
                <Route path="/explore/assets" element={<AssetGallery />} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />
                <Route path="/auctions/:id" element={<AuctionDetails />} />
                <Route path="/users/:id" element={<PublicProfile />} />
                <Route path="/users/:id/assets" element={<SellerAssets />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-asset" element={<CreateAssetPage />} />
                <Route path="/schedule-auction" element={<ScheduleAuctionPage />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
