import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./SiteLayout";
import { AdminPage } from "../pages/AdminPage";
import { BrandShell } from "../sections/BrandShell";
import { LoginPage } from "../pages/LoginPage";
import { MyPage } from "../pages/MyPage";
import { MenuPage } from "../pages/MenuPage";
import { ReservationPage } from "../pages/ReservationPage";
import { SignupPage } from "../pages/SignupPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<BrandShell />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="reserve" element={<ReservationPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
