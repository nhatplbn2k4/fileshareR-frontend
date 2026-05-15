import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft, Home } from 'lucide-react';

const STATUS_CONFIG = {
  SUCCESS: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Thanh toán thành công',
    message: 'Giao dịch của bạn đã được xử lý thành công. Gói/dung lượng đã được kích hoạt.',
  },
  PENDING: {
    icon: Clock,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Đang xử lý thanh toán',
    message: 'Giao dịch đang được xác nhận. Vui lòng đợi vài phút và kiểm tra lại trạng thái tại trang Cài đặt.',
  },
  FAILED: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Thanh toán thất bại',
    message: 'Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiền đã bị trừ.',
  },
  CANCELLED: {
    icon: XCircle,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Giao dịch đã hủy',
    message: 'Bạn đã hủy giao dịch này. Bạn có thể thử lại bất cứ lúc nào.',
  },
};

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawStatus = (searchParams.get('status') || 'PENDING').toUpperCase();
  const txnRef = searchParams.get('txnRef') || searchParams.get('orderId') || '';
  const message = searchParams.get('message') || '';

  const config = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  const [countdown, setCountdown] = useState(rawStatus === 'SUCCESS' ? 5 : null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate('/settings');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-ocean-100 flex items-center justify-center p-4">
      <div className={`max-w-md w-full ${config.bgColor} border-2 ${config.borderColor} rounded-2xl shadow-xl p-8`}>
        <div className="flex flex-col items-center text-center">
          <div className={`${config.bgColor} rounded-full p-4 mb-4`}>
            <Icon className={`w-16 h-16 ${config.iconColor}`} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>

          <p className="text-gray-600 mb-6">
            {message || config.message}
          </p>

          {txnRef && (
            <div className="w-full bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Mã giao dịch
              </p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {txnRef}
              </p>
            </div>
          )}

          {countdown !== null && countdown > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Tự động chuyển về trang Cài đặt sau {countdown}s...
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              to="/settings"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Về Cài đặt
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium"
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
