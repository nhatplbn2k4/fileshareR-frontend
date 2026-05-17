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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import adminService from '../../services/adminService';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const formatVnd = (vnd) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd || 0);

const formatShortVnd = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return String(v);
};

const formatShortDate = (d) => {
  // d = "2026-05-17" → "17/05"
  if (!d || d.length < 10) return d;
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
};

const formatShortMonth = (m) => {
  // m = "2026-05" → "T5/26"
  if (!m || m.length < 7) return m;
  return `T${parseInt(m.slice(5, 7), 10)}/${m.slice(2, 4)}`;
};

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

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="mb-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];
const STATUS_COLORS = {
  SUCCESS: '#10b981',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
  CANCELLED: '#6b7280',
  EXPIRED: '#9ca3af',
};
const PLAN_COLORS = {
  FREE: '#9ca3af',
  PREMIUM: '#f59e0b',
  NO_PLAN: '#d1d5db',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c] = await Promise.all([adminService.getStats(), adminService.getCharts()]);
        setStats(s);
        setCharts(c);
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

  const signupData = charts.signupsLast30Days.map((p) => ({
    ...p,
    label: formatShortDate(p.date),
  }));
  const revenueDailyData = charts.revenueLast30Days.map((p) => ({
    ...p,
    label: formatShortDate(p.date),
  }));
  const revenueMonthlyData = charts.revenueLast12Months.map((p) => ({
    ...p,
    label: formatShortMonth(p.month),
  }));
  const docsData = charts.documentsByType.map((d) => ({ name: d.label, value: d.count }));
  const paymentsData = charts.paymentsByStatus.map((d) => ({
    name: d.label,
    value: d.count,
    color: STATUS_COLORS[d.label] || '#6b7280',
  }));
  const plansData = charts.usersByPlan.map((d) => ({
    name: d.label,
    value: d.count,
    color: PLAN_COLORS[d.label] || PIE_COLORS[0],
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tổng Quan</h1>
        <p className="text-gray-600 mt-1">Thống kê toàn hệ thống FileShareR</p>
      </div>

      {/* Stat cards */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Người dùng</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Tổng người dùng" value={stats.totalUsers.toLocaleString('vi-VN')} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard icon={Crown} label="Premium" value={stats.premiumUsers.toLocaleString('vi-VN')} sub={`${stats.totalUsers ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% tổng`} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
        <StatCard icon={UserCheck} label="Đang hoạt động" value={stats.activeUsers.toLocaleString('vi-VN')} gradient="bg-gradient-to-br from-emerald-500 to-green-600" />
        <StatCard icon={UserPlus} label="Đăng ký hôm nay" value={stats.signupsToday.toLocaleString('vi-VN')} gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Nội dung</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileText} label="Tổng tài liệu" value={stats.totalDocuments.toLocaleString('vi-VN')} gradient="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatCard icon={UsersRound} label="Tổng nhóm" value={stats.totalGroups.toLocaleString('vi-VN')} gradient="bg-gradient-to-br from-pink-500 to-rose-600" />
        <StatCard icon={HardDrive} label="Dung lượng đã dùng" value={formatBytes(stats.totalStorageUsedBytes)} sub={`${storagePercent}% trên ${formatBytes(stats.totalStorageQuotaBytes)}`} gradient="bg-gradient-to-br from-slate-500 to-gray-700" />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Wallet} label="Tổng doanh thu" value={formatVnd(stats.totalRevenueVnd)} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
        <StatCard icon={TrendingUp} label="Doanh thu 30 ngày" value={formatVnd(stats.revenueLast30dVnd)} gradient="bg-gradient-to-br from-lime-500 to-green-600" />
        <StatCard icon={CheckCircle} label="Giao dịch thành công" value={stats.successPaymentsCount.toLocaleString('vi-VN')} gradient="bg-gradient-to-br from-teal-500 to-cyan-600" />
        <StatCard icon={Clock} label="Đang xử lý" value={stats.pendingPaymentsCount.toLocaleString('vi-VN')} gradient="bg-gradient-to-br from-yellow-500 to-amber-500" />
      </div>

      {/* Charts row 1: time-series */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Biểu đồ thời gian</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Đăng ký mới theo ngày" subtitle="30 ngày gần đây">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={signupData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Người dùng']} labelFormatter={(l) => `Ngày ${l}`} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Đăng ký" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Doanh thu theo ngày" subtitle="30 ngày gần đây · VND">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueDailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatShortVnd} />
              <Tooltip formatter={(v) => [formatVnd(v), 'Doanh thu']} labelFormatter={(l) => `Ngày ${l}`} />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#revColor)" strokeWidth={2} name="Doanh thu" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2: revenue monthly */}
      <div className="mb-6">
        <ChartCard title="Doanh thu theo tháng" subtitle="12 tháng gần đây · VND">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueMonthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatShortVnd} />
              <Tooltip formatter={(v) => [formatVnd(v), 'Doanh thu']} labelFormatter={(l) => `Tháng ${l}`} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Doanh thu tháng" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 3: categorical */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Người dùng theo gói" subtitle="FREE / PREMIUM">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={plansData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} label={(e) => `${e.name} (${e.value})`} labelLine={false}>
                {plansData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tài liệu theo loại file">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={docsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Tài liệu']} />
              <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                {docsData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Giao dịch theo trạng thái">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={paymentsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value}`} labelLine={false}>
                {paymentsData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Storage gauge */}
      <div className="mb-6">
        <ChartCard title="Tỷ lệ sử dụng dung lượng toàn hệ thống">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={220} height={220}>
                <RadialBarChart innerRadius="65%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ name: 'Used', value: storagePercent, fill: storagePercent > 80 ? '#ef4444' : storagePercent > 50 ? '#f59e0b' : '#10b981' }]}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f3f4f6' }} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900" style={{ fontSize: 28, fontWeight: 700 }}>
                    {storagePercent}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã dùng</span>
                <span className="font-semibold text-gray-900">{formatBytes(stats.totalStorageUsedBytes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng quota</span>
                <span className="font-semibold text-gray-900">{formatBytes(stats.totalStorageQuotaBytes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Còn trống</span>
                <span className="font-semibold text-gray-900">{formatBytes(Math.max(0, stats.totalStorageQuotaBytes - stats.totalStorageUsedBytes))}</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
