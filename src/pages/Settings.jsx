import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import billingService from '../services/billingService';
import StorageProgress from '../components/StorageProgress';
import StorageUpgradeModal from '../components/StorageUpgradeModal';
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Camera,
  AlertCircle,
  CheckCircle,
  Shield,
  KeyRound,
  Send,
  HardDrive,
} from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  // Storage state
  const [storage, setStorage] = useState(null);
  const [storageOpen, setStorageOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    billingService.getMyStorage()
      .then((info) => mounted && setStorage(info))
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Email verification state
  const [emailVerificationStep, setEmailVerificationStep] = useState(0); // 0: initial, 1: OTP sent, 2: verified
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState({ type: '', text: '' });

  // Password state
  const [passwordStep, setPasswordStep] = useState(0); // 0: initial, 1: OTP sent, 2: verified
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Handle profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const updatedUser = await authService.updateProfile(profileData);
      updateUser(updatedUser);
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      setProfileMessage({ type: 'error', text: errorMsg });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle email verification
  const handleSendEmailOtp = async () => {
    setEmailVerificationLoading(true);
    setEmailVerificationMessage({ type: '', text: '' });

    try {
      const response = await authService.sendEmailVerificationOtp();
      setEmailVerificationMessage({ type: 'success', text: response });
      setEmailVerificationStep(1);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP';
      setEmailVerificationMessage({ type: 'error', text: errorMsg });
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailVerificationLoading(true);
    setEmailVerificationMessage({ type: '', text: '' });

    try {
      const response = await authService.verifyEmailOtp(emailOtp);
      setEmailVerificationMessage({ type: 'success', text: response });
      setEmailVerificationStep(2);
      // Update user state
      const updatedUser = await authService.getCurrentUser();
      updateUser(updatedUser);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Mã OTP không hợp lệ';
      setEmailVerificationMessage({ type: 'error', text: errorMsg });
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  // Handle password change with OTP
  const handleSendPasswordOtp = async () => {
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await authService.sendChangePasswordOtp();
      setPasswordMessage({ type: 'success', text: response });
      setPasswordStep(1);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP';
      setPasswordMessage({ type: 'error', text: errorMsg });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyPasswordOtp = async () => {
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await authService.verifyChangePasswordOtp(passwordOtp);
      setPasswordMessage({ type: 'success', text: response });
      setPasswordStep(2);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Mã OTP không hợp lệ';
      setPasswordMessage({ type: 'error', text: errorMsg });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordData);
      setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStep(0);
      setPasswordOtp('');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      setPasswordMessage({ type: 'error', text: errorMsg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Message component
  const Message = ({ type, text }) => {
    if (!text) return null;

    return (
      <div className={`flex items-center space-x-2 p-3 rounded-lg mb-4 ${type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <span className="text-sm">{text}</span>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Cài Đặt Tài Khoản</h1>
          <p className="text-ocean-100">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-ocean-500 rounded-full flex items-center justify-center text-white hover:bg-ocean-600 transition-colors shadow-lg cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const result = await authService.uploadAvatar(file);
                        const updatedUser = { ...user, avatarUrl: result.avatarUrl };
                        updateUser(updatedUser);
                        toast.success('Đổi ảnh đại diện thành công!');
                      } catch (err) {
                        toast.error('Upload avatar thất bại: ' + (err?.response?.data?.message || err.message));
                      }
                    }} />
                  </label>
                </div>

                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">{user?.fullName}</h3>
                  {user?.authProvider === 'LOCAL' && (
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  )}
                  {user?.authProvider && user?.authProvider !== 'LOCAL' && (
                    <p className="text-sm text-gray-400">Đăng nhập bằng {user.authProvider === 'GOOGLE' ? 'Google' : 'Facebook'}</p>
                  )}
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <span className="px-3 py-1 bg-ocean-100 text-ocean-700 text-xs font-medium rounded-full">
                      {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                    {user?.emailVerified ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã xác thực
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        Chưa xác thực
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <HardDrive className="w-5 h-5 mr-2 text-ocean-500" />
                Bộ Nhớ
              </h3>
              {storage ? (
                <>
                  <StorageProgress
                    used={storage.storageUsed}
                    total={storage.totalQuotaBytes}
                    planName={storage.plan?.name}
                  />
                  {storage.bonusStorageBytes > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      Bao gồm bonus đã mua thêm.
                    </div>
                  )}
                  <button
                    onClick={() => setStorageOpen(true)}
                    className="mt-4 w-full px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm font-medium hover:bg-ocean-600 transition-colors"
                  >
                    Nâng cấp / Mua thêm
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500">Đang tải...</div>
              )}
            </div>

            {/* Email Verification Card — ẩn cho OAuth users */}
            {!user?.emailVerified && user?.authProvider === 'LOCAL' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Shield className="w-5 h-5 mr-2 text-yellow-500" />
                  Xác Thực Email
                </h3>

                <Message type={emailVerificationMessage.type} text={emailVerificationMessage.text} />

                {emailVerificationStep === 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Xác thực email để bảo mật tài khoản và sử dụng đầy đủ tính năng.
                    </p>
                    <button
                      onClick={handleSendEmailOtp}
                      disabled={emailVerificationLoading}
                      className="w-full flex items-center justify-center space-x-2 bg-yellow-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {emailVerificationLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Gửi Mã OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {emailVerificationStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Nhập mã OTP đã gửi đến email của bạn.
                    </p>
                    <input
                      type="text"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-xl tracking-widest focus:ring-2 focus:ring-ocean-500"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerifyEmailOtp}
                      disabled={emailVerificationLoading || emailOtp.length !== 6}
                      className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {emailVerificationLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Xác Nhận</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSendEmailOtp}
                      disabled={emailVerificationLoading}
                      className="w-full text-ocean-600 text-sm hover:underline"
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-ocean-500" />
                  Thông Tin Cá Nhân
                </h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
                <Message type={profileMessage.type} text={profileMessage.text} />

                {user?.authProvider === 'LOCAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>
                </div>

                <div>
                  {/* Avatar upload đã có ở Profile Card bên trên */}
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white py-3 px-4 rounded-lg font-medium hover:from-ocean-600 hover:to-ocean-700 transition-all duration-200 disabled:opacity-50"
                >
                  {profileLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Password Form with OTP — ẩn cho OAuth users */}
            {user?.authProvider === 'LOCAL' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-ocean-500" />
                  Đổi Mật Khẩu
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Cần xác thực OTP qua email để đổi mật khẩu
                </p>
              </div>
              <div className="p-6 space-y-4">
                <Message type={passwordMessage.type} text={passwordMessage.text} />

                {/* Step indicators */}
                <div className="flex items-center justify-center mb-6">
                  {[1, 2, 3].map((s, index) => (
                    <React.Fragment key={s}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${passwordStep >= s - 1
                        ? 'bg-ocean-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                        }`}>
                        {s}
                      </div>
                      {index < 2 && (
                        <div className={`w-8 h-1 ${passwordStep >= s ? 'bg-ocean-500' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 0: Send OTP */}
                {passwordStep === 0 && (
                  <div className="text-center space-y-4">
                    <KeyRound className="w-12 h-12 text-ocean-500 mx-auto" />
                    <p className="text-gray-600">
                      Nhấn nút bên dưới để nhận mã OTP xác thực qua email
                    </p>
                    <button
                      onClick={handleSendPasswordOtp}
                      disabled={passwordLoading}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white py-3 px-4 rounded-lg font-medium hover:from-ocean-600 hover:to-ocean-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Gửi Mã OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Step 1: Verify OTP */}
                {passwordStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-center text-gray-600">
                      Nhập mã OTP đã gửi đến email của bạn
                    </p>
                    <input
                      type="text"
                      value={passwordOtp}
                      onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-ocean-500"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerifyPasswordOtp}
                      disabled={passwordLoading || passwordOtp.length !== 6}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white py-3 px-4 rounded-lg font-medium hover:from-ocean-600 hover:to-ocean-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Xác Nhận OTP</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSendPasswordOtp}
                      disabled={passwordLoading}
                      className="w-full text-ocean-600 text-sm hover:underline"
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>
                )}

                {/* Step 2: Change Password */}
                {passwordStep === 2 && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật Khẩu Hiện Tại
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập mật khẩu hiện tại')}
                          onInput={(e) => e.target.setCustomValidity('')}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-500"
                          placeholder="Nhập mật khẩu hiện tại"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật Khẩu Mới
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập mật khẩu mới (tối thiểu 6 ký tự)')}
                          onInput={(e) => e.target.setCustomValidity('')}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-500"
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Xác Nhận Mật Khẩu Mới
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập lại mật khẩu mới')}
                          onInput={(e) => e.target.setCustomValidity('')}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-500"
                          placeholder="Nhập lại mật khẩu mới"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white py-3 px-4 rounded-lg font-medium hover:from-ocean-600 hover:to-ocean-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>Đổi Mật Khẩu</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <StorageUpgradeModal
        open={storageOpen}
        onClose={() => setStorageOpen(false)}
        onSuccess={(info) => setStorage(info)}
        context="user"
        currentPlanCode={storage?.plan?.code}
      />
    </MainLayout>
  );
};

export default Settings;
