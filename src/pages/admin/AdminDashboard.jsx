import React, { useEffect, useState } from 'react';
import {
  Users,
  Crown,
  UserCheck,
  UserPlus,
  FileText,
  UsersRound,
  HardDrive,
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
} from 'lucide-react';
import adminService from '../../services/adminService';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const formatVnd = (vnd) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd || 0);

const StatCard = ({ icon: Icon, label, value, sub, gradient }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-lg ${gradient} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Không thể tải dữ liệu: {error}
      </div>
    );
  }

  const storagePercent = stats.totalStorageQuotaBytes > 0
    ? Math.round((stats.totalStorageUsedBytes / stats.totalStorageQuotaBytes) * 100)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tổng Quan</h1>
        <p className="text-gray-600 mt-1">Thống kê toàn hệ thống FileShareR</p>
      </div>

      {/* Users section */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Người dùng</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Tổng người dùng"
          value={stats.totalUsers.toLocaleString('vi-VN')}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Crown}
          label="Premium"
          value={stats.premiumUsers.toLocaleString('vi-VN')}
          sub={`${stats.totalUsers ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% tổng`}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          icon={UserCheck}
          label="Đang hoạt động"
          value={stats.activeUsers.toLocaleString('vi-VN')}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
        />
        <StatCard
          icon={UserPlus}
          label="Đăng ký hôm nay"
          value={stats.signupsToday.toLocaleString('vi-VN')}
          gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
      </div>

      {/* Content section */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Nội dung</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={FileText}
          label="Tổng tài liệu"
          value={stats.totalDocuments.toLocaleString('vi-VN')}
          gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
        />
        <StatCard
          icon={UsersRound}
          label="Tổng nhóm"
          value={stats.totalGroups.toLocaleString('vi-VN')}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
        />
        <StatCard
          icon={HardDrive}
          label="Dung lượng đã dùng"
          value={formatBytes(stats.totalStorageUsedBytes)}
          sub={`${storagePercent}% trên ${formatBytes(stats.totalStorageQuotaBytes)}`}
          gradient="bg-gradient-to-br from-slate-500 to-gray-700"
        />
      </div>

      {/* Revenue section */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Tổng doanh thu"
          value={formatVnd(stats.totalRevenueVnd)}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Doanh thu 30 ngày"
          value={formatVnd(stats.revenueLast30dVnd)}
          gradient="bg-gradient-to-br from-lime-500 to-green-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Giao dịch thành công"
          value={stats.successPaymentsCount.toLocaleString('vi-VN')}
          gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
        />
        <StatCard
          icon={Clock}
          label="Đang xử lý"
          value={stats.pendingPaymentsCount.toLocaleString('vi-VN')}
          gradient="bg-gradient-to-br from-yellow-500 to-amber-500"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
