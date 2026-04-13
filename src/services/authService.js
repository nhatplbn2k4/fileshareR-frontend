import api from './api';
import { auth, googleProvider, facebookProvider } from '../config/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const authService = {
  // ── Firebase OAuth ────────────────────────────────────────────────────────

  firebaseLoginWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return authService._sendFirebaseToken(idToken);
  },

  firebaseLoginWithFacebook: async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const idToken = await result.user.getIdToken();
      return authService._sendFirebaseToken(idToken);
    } catch (err) {
      // Popup bị block hoặc Facebook SDK lỗi → fallback sang redirect
      if (err.code === 'auth/popup-blocked' || err.message?.includes('loginWithPermissions')) {
        await signInWithRedirect(auth, facebookProvider);
        return null; // redirect sẽ reload page, xử lý ở checkRedirectResult
      }
      throw err;
    }
  },

  // Gọi khi app load — xử lý kết quả redirect (Facebook fallback)
  checkRedirectResult: async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        const idToken = await result.user.getIdToken();
        return authService._sendFirebaseToken(idToken);
      }
    } catch { /* ignore */ }
    return null;
  },

  _sendFirebaseToken: async (firebaseIdToken) => {
    const response = await api.post('/auth/firebase-login', { idToken: firebaseIdToken });
    const { accessToken, refreshToken, user } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  // Đăng ký
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Đăng nhập
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data;

    // Lưu tokens và user info vào localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  // Đăng xuất
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await api.get('/auth/account');
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Cập nhật thông tin profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    // Cập nhật user trong localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // ==================== EMAIL VERIFICATION ====================

  // Gửi OTP xác thực email (đã đăng nhập)
  sendEmailVerificationOtp: async () => {
    const response = await api.post('/api/otp/email-verification/send');
    return response.data;
  },

  // Gửi OTP xác thực email bằng email (chưa đăng nhập - dùng sau đăng ký)
  sendEmailVerificationOtpByEmail: async (email) => {
    const response = await api.post(`/api/otp/email-verification/send/${email}`);
    return response.data;
  },

  // Xác thực email bằng OTP (đã đăng nhập)
  verifyEmailOtp: async (otp) => {
    const response = await api.post(`/api/otp/email-verification/verify/${otp}`);
    return response.data;
  },

  // Xác thực email bằng OTP và email (chưa đăng nhập - dùng sau đăng ký)
  verifyEmailOtpByEmail: async (email, otp) => {
    const response = await api.post(`/api/otp/email-verification/verify/${email}/${otp}`);
    return response.data;
  },

  // ==================== FORGOT PASSWORD ====================

  // Gửi OTP quên mật khẩu
  sendForgotPasswordOtp: async (email) => {
    const response = await api.post(`/forgot-password/send-otp/${email}`);
    return response.data;
  },

  // Xác thực OTP quên mật khẩu
  verifyForgotPasswordOtp: async (email, otp) => {
    const response = await api.post(`/forgot-password/verify-otp/${email}/${otp}`);
    return response.data;
  },

  // Đặt lại mật khẩu
  resetPassword: async (email, passwordData) => {
    const response = await api.post(`/forgot-password/reset-password/${email}`, passwordData);
    return response.data;
  },

  // ==================== CHANGE PASSWORD WITH OTP ====================

  // Gửi OTP đổi mật khẩu
  sendChangePasswordOtp: async () => {
    const response = await api.post('/api/otp/change-password/send');
    return response.data;
  },

  // Xác thực OTP đổi mật khẩu
  verifyChangePasswordOtp: async (otp) => {
    const response = await api.post(`/api/otp/change-password/verify/${otp}`);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Lấy user từ localStorage
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;
