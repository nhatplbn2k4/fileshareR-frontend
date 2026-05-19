import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import logoImg from '../assets/logo1024x1024.png';
import loginBg from '../assets/login-backgroud.png';

const SUB_TAGLINES = [
  'Khôi phục tài khoản an toàn',
  'Xác thực qua email chỉ trong vài giây',
  'Bảo mật tài liệu của bạn 24/7',
  'Quay lại quản lý tài liệu nhanh chóng',
];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTagIndex((i) => (i + 1) % SUB_TAGLINES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await authService.sendForgotPasswordOtp(email);
      setMessage({ type: 'success', text: response });
      setStep(2);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await authService.verifyForgotPasswordOtp(email, otp);
      setMessage({ type: 'success', text: response });
      setStep(3);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Mã OTP không hợp lệ.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      setLoading(false);
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      setLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword(email, passwords);
      setMessage({ type: 'success', text: response });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await authService.sendForgotPasswordOtp(email);
      setMessage({ type: 'success', text: response });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const Message = ({ type, text }) => {
    if (!text) return null;
    const isSuccess = type === 'success';
    return (
      <div
        className={`flex items-center space-x-2 p-3 rounded-lg mb-4 backdrop-blur-sm border ${
          isSuccess
            ? 'bg-green-500/20 border-green-400/40 text-green-50'
            : 'bg-red-500/20 border-red-400/40 text-red-50'
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <span className="text-sm">{text}</span>
      </div>
    );
  };

  const stepSubtitle =
    step === 1 ? 'Nhập email để nhận mã xác thực'
    : step === 2 ? 'Nhập mã OTP đã gửi đến email của bạn'
    : 'Tạo mật khẩu mới cho tài khoản';

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
            Khôi phục<br />
            mật khẩu của bạn<br />
            <span className="text-ocean-200">trong vài bước</span>
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
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow">Quên mật khẩu</h2>
              <p className="text-ocean-50 mb-6">{stepSubtitle}</p>

              {/* Step indicator */}
              <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((s, index) => (
                  <React.Fragment key={s}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        step >= s
                          ? 'bg-white text-ocean-700 shadow-lg'
                          : 'bg-white/20 text-white/60 border border-white/30'
                      }`}
                    >
                      {s}
                    </div>
                    {index < 2 && (
                      <div className={`w-12 h-1 transition-all ${step > s ? 'bg-white' : 'bg-white/20'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <Message type={message.type} text={message.text} />

              {/* Step 1: Email */}
              {step === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition"
                        placeholder="Nhập email của bạn"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-white text-ocean-700 py-3 rounded-lg font-semibold hover:bg-ocean-50 transition shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-ocean-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>Gửi Mã OTP</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: OTP */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Mã OTP</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition text-center text-2xl tracking-widest font-semibold"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-white/70 text-center">Mã OTP hết hạn sau 5 phút</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-white text-ocean-700 py-3 rounded-lg font-semibold hover:bg-ocean-50 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-ocean-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Xác Nhận OTP</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-ocean-100 hover:text-white text-sm font-medium transition disabled:opacity-50"
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Mật khẩu mới</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition"
                        placeholder="Nhập mật khẩu mới"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition"
                        placeholder="Nhập lại mật khẩu mới"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-white text-ocean-700 py-3 rounded-lg font-semibold hover:bg-ocean-50 transition shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-ocean-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Đặt Lại Mật Khẩu</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-ocean-100 hover:text-white font-medium transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại đăng nhập</span>
                </Link>
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

export default ForgotPassword;
