import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Meeple from "./Meeple";
import "./auth.css";

const API_URL = "http://localhost:8080";          // พอร์ตของ backend
const REGISTER_PATH = "/api/register";       // path สมัครสมาชิก

function PasswordField({ id, name, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <Lock size={20} />
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="eye"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
      >
        {show ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    accept: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.email || !form.password)
      return setError("กรุณากรอกข้อมูลให้ครบ");
    if (form.password.length < 8)
      return setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (form.password !== form.confirm)
      return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    if (!form.accept) return setError("กรุณายอมรับเงื่อนไขการใช้งาน");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}${REGISTER_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || "สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง");
        return;
      }

      navigate("/login");
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend ทำงานอยู่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Meeple className="deco deco-r1" color="#2f6fd6" size={140} />
      <span className="deco deco-dice deco-dice-l" aria-hidden="true">🎲</span>

      <section className="auth-card">
        <div className="auth-top-meeples" aria-hidden="true">
          <Meeple color="#2f6fd6" size={72} />
          <Meeple color="#e5483b" size={80} />
          <Meeple color="#f5b81c" size={72} />
        </div>
        <h1>สมัครสมาชิก</h1>
        <p className="auth-sub">มาเริ่มต้นการผจญภัยในโลกบอร์ดเกมไปด้วยกัน!</p>

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="username">ชื่อผู้ใช้</label>
          <div className="field">
            <User size={20} />
            <input
              id="username"
              name="username"
              placeholder="กรอกชื่อผู้ใช้ที่ต้องการ"
              value={form.username}
              onChange={onChange}
              autoComplete="username"
            />
          </div>

          <label htmlFor="email">อีเมล</label>
          <div className="field">
            <Mail size={20} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="กรอกอีเมลของคุณ"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
            />
          </div>

          <label htmlFor="password">รหัสผ่าน</label>
          <PasswordField
            id="password"
            name="password"
            placeholder="กรอกรหัสผ่าน"
            value={form.password}
            onChange={onChange}
            autoComplete="new-password"
          />

          <label htmlFor="confirm">ยืนยันรหัสผ่าน</label>
          <PasswordField
            id="confirm"
            name="confirm"
            placeholder="ยืนยันรหัสผ่านอีกครั้ง"
            value={form.confirm}
            onChange={onChange}
            autoComplete="new-password"
          />

          <label className="check terms">
            <input type="checkbox" name="accept" checked={form.accept} onChange={onChange} />
            <span>
              ฉันยอมรับ<Link to="/terms" className="link">เงื่อนไขการใช้งาน</Link>และ
              <Link to="/privacy" className="link">นโยบายความเป็นส่วนตัว</Link>
            </span>
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="switch">
          มีบัญชีอยู่แล้ว? <Link to="/login" className="link">เข้าสู่ระบบ</Link>
        </p>
      </section>
    </main>
  );
}
