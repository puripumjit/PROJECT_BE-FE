import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Placeholder from './pages/Placeholder.jsx'

function Layout() {
  return (
    <div className=" bg-[#fdf8f1]">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="categories" element={<Placeholder title="หมวดหมู่" />} />
        <Route path="games" element={<Placeholder title="เกมทั้งหมด" />} />
        <Route path="about" element={<Placeholder title="เกี่ยวกับเรา" />} />
        <Route path="login" element={<Placeholder title="เข้าสู่ระบบ" />} />
        <Route path="register" element={<Placeholder title="สมัครสมาชิก" />} />
        <Route path="*" element={<Placeholder title="ไม่พบหน้านี้" />} />
      </Route>
    </Routes>
  )
}