import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';
import loginBg from '../assets/login-backgroud.png';
import logoImg from '../assets/logo1024x1024.png';

const SUB_TAGLINES = [
  'Lưu trữ an toàn, truy cập mọi nơi',
  'Chia sẻ tài liệu chỉ với một liên kết',
  'Tổ chức nhóm làm việc thông minh',
  'AI tóm tắt nội dung tự động',
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const id = setInterval(() => setTagIndex((i) => (i + 1) % SUB_TAGLINES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await login(formData);
    } catch (err) {
      const errorCode = err.response?.data?.code;
      if (errorCode === 7006) {
        try {
          await authService.sendEmailVerificationOtpByEmail(formData.email);
          navigate('/verify-email', { state: { email: formData.email, fromLogin: true } });
        } catch {
          setError('Không thể gửi mã xác thực. Vui lòng thử lại.');
        }
      } else {
        setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Overlay gradient — tối bên trái cho chữ trắng đọc rõ, nhẹ dần sang phải */}
      <div className="absolute inset-0 bg-gradient-to-r from-ocean-900/75 via-ocean-800/50 to-ocean-600/25" />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* LEFT — Title + Rotating sub-tagline */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 text-white">
          <Link to="/" className="inline-flex items-center space-x-3 mb-10 lg:mb-12 w-fit">
            <img
              src={logoImg}
              alt="FileShareR"
              className="w-14 h-14 rounded-xl shadow-lg object-contain bg-white/95 p-1"
            />
            <span className="text-3xl font-bold tracking-tight drop-shadow">FileShareR</span>
          </Link>

          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 drop-shadow-lg">
            Quản lý &<br />
            chia sẻ tài liệu<br />
            <span className="text-ocean-200">thông minh</span>
          </h1>

          <div className="h-12 relative overflow-hidden">
            {SUB_TAGLINES.map((line, i) => (
              <p
                key={i}
                className={`absolute inset-0 text-lg lg:text-xl text-ocean-50 transition-all duration-700 ${
                  i === tagIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          <div className="flex space-x-2 mt-8">
            {SUB_TAGLINES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTagIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === tagIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT — Glass form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-md">
            <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-8 lg:p-10">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow">Đăng nhập</h2>
              <p className="text-ocean-50 mb-8">Tiếp tục quản lý tài liệu của bạn</p>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-400/40 rounded-lg text-green-50 text-sm backdrop-blur-sm">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/40 rounded-lg text-red-50 text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập email')}
                      onInput={(e) => e.target.setCustomValidity('')}
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập mật khẩu')}
                      onInput={(e) => e.target.setCustomValidity('')}
                      className="w-full pl-10 pr-10 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <Link to="/forgot-password" className="text-sm text-ocean-100 hover:text-white transition">
                      Quên mật khẩu?
                    </Link>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-ocean-700 py-3 rounded-lg font-semibold hover:bg-ocean-50 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-ocean-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang đăng nhập...
                    </span>
                  ) : (
                    'Đăng Nhập'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 border-t border-white/30" />
                <span className="text-sm text-white/70">hoặc</span>
                <div className="flex-1 border-t border-white/30" />
              </div>

              {/* Social */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={async () => {
                    setSocialLoading('google');
                    try { await loginWithGoogle(); }
                    catch (err) {
                      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
                        setError(err.message || 'Đăng nhập Google thất bại');
                      }
                    } finally { setSocialLoading(null); }
                  }}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-700 rounded-lg hover:bg-ocean-50 transition shadow-md disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {socialLoading === 'google' ? 'Đang xử lý...' : 'Đăng nhập bằng Google'}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setSocialLoading('facebook');
                    try { await loginWithFacebook(); }
                    catch (err) {
                      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
                        setError(err.message || 'Đăng nhập Facebook thất bại');
                      }
                    } finally { setSocialLoading(null); }
                  }}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition shadow-md disabled:opacity-60"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {socialLoading === 'facebook' ? 'Đang xử lý...' : 'Đăng nhập bằng Facebook'}
                </button>
              </div>

              {/* Register */}
              <div className="mt-6 text-center">
                <p className="text-white/80">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="text-white font-semibold hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-center mt-6 text-white/60 text-sm">
              © 2026 FileShareR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
