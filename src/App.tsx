import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Header } from '@/components/Header';
import { CustomerTabBar } from '@/components/CustomerTabBar';
import { RequireCustomer } from '@/routes/RequireCustomer';
import { RequireAdmin } from '@/routes/RequireAdmin';
import { LandingPage } from '@/pages/LandingPage';
import { MenuPage } from '@/pages/MenuPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LoginPage } from '@/pages/LoginPage';
import { OrderPage } from '@/pages/OrderPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminRewardsPage } from '@/pages/admin/AdminRewardsPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';

function SiteLayout({ children }: { children: ReactNode }) {
  const { session, isAdmin } = useAuth();
  const showTabBar = Boolean(session) && !isAdmin;
  return (
    <main className={`site-shell ${showTabBar ? 'has-tab-bar' : ''}`}>
      <Header />
      {children}
      {showTabBar && <CustomerTabBar />}
    </main>
  );
}

function HomeRoute() {
  const { session, isAdmin, loading } = useAuth();
  if (!loading && session && !isAdmin) {
    return <Navigate to="/profile" replace />;
  }
  return (
    <SiteLayout>
      <LandingPage />
    </SiteLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin">
              <Route index element={<AdminLoginPage />} />
              <Route element={<RequireAdmin />}>
                <Route element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="rewards" element={<AdminRewardsPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<HomeRoute />} />
            <Route
              path="/menu"
              element={
                <SiteLayout>
                  <MenuPage />
                </SiteLayout>
              }
            />
            <Route
              path="/register"
              element={
                <SiteLayout>
                  <RegisterPage />
                </SiteLayout>
              }
            />
            <Route
              path="/login"
              element={
                <SiteLayout>
                  <LoginPage />
                </SiteLayout>
              }
            />
            <Route element={<RequireCustomer />}>
              <Route
                path="/order"
                element={
                  <SiteLayout>
                    <OrderPage />
                  </SiteLayout>
                }
              />
              <Route
                path="/profile"
                element={
                  <SiteLayout>
                    <ProfilePage />
                  </SiteLayout>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
