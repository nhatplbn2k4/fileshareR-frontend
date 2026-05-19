import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo1024x1024.png';
import loginBg from '../assets/login-backgroud.png';

const SUB_TAGLINES = [
  'Lưu trữ an toàn, truy cập mọi nơi',
  'Chia sẻ tài liệu chỉ với một liên kết',
  'Tổ chức nhóm làm việc thông minh',
  'AI tóm tắt nội dung tự động',
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTagIndex((i) => (i + 1) % SUB_TAGLINES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
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
            Bắt đầu hành trình<br />
            quản lý tài liệu<br />
            <span className="text-ocean-200">cùng chúng tôi</span>
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
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow">Tạo tài khoản</h2>
              <p className="text-ocean-50 mb-8">Đăng ký miễn phí để bắt đầu</p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/40 rounded-lg text-red-50 text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập họ và tên')}
                      onInput={(e) => e.target.setCustomValidity('')}
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                </div>

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
                      onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập email hợp lệ')}
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
                      onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập mật khẩu (tối thiểu 6 ký tự)')}
                      onInput={(e) => e.target.setCustomValidity('')}
                      className="w-full pl-10 pr-10 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition"
                      placeholder="••••••••"
                      minLength={6}
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
                  <p className="mt-1.5 text-xs text-white/60">Tối thiểu 6 ký tự</p>
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
                      Đang đăng ký...
                    </span>
                  ) : (
                    'Đăng Ký'
                  )}
                </button>
              </form>

              {/* Login link */}
              <div className="mt-6 text-center">
                <p className="text-white/80">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-white font-semibold hover:underline">
                    Đăng nhập ngay
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

export default Register;
