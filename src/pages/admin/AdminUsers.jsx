import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
  Power,
  PowerOff,
  RefreshCw,
} from 'lucide-react';
import adminService from '../../services/adminService';
import billingService from '../../services/billingService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const RoleBadge = ({ role }) => {
  const isAdmin = role === 'ADMIN';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
      isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {isAdmin && <ShieldCheck className="w-3 h-3" />}
      {role}
    </span>
  );
};

const PlanBadge = ({ code, name }) => {
  const isPremium = code === 'PREMIUM';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
      isPremium ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {isPremium && <Crown className="w-3 h-3" />}
      {name || code || 'No plan'}
    </span>
  );
};

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
    active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
    {active ? 'Hoạt động' : 'Đã khoá'}
  </span>
);

const ConfirmDialog = ({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const [search, setSearch] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [isActive, setIsActive] = useState('');

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // Debounce search input
  const [searchDraft, setSearchDraft] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchDraft);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  // Load plan list once for dropdown
  useEffect(() => {
    billingService.listPlans()
      .then((data) => setPlans(data || []))
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listUsers({
        search: search || undefined,
        planCode: planCode || undefined,
        isActive: isActive === '' ? undefined : isActive === 'true',
        page,
        size,
      });
      setUsers(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, planCode, isActive, page]);

  const handleChangeTier = async (user, newPlanCode) => {
    if (newPlanCode === user.planCode) return;
    setActingId(user.id);
    try {
      const updated = await adminService.updateUser(user.id, { planCode: newPlanCode });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast.success(`Đã đổi gói ${user.email} sang ${newPlanCode}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi gói thất bại');
    } finally {
      setActingId(null);
    }
  };

  const handleToggleActive = (user) => {
    const willActivate = !user.isActive;
    setConfirm({
      title: willActivate ? 'Mở khoá tài khoản?' : 'Khoá tài khoản?',
      message: willActivate
        ? `User ${user.email} sẽ được phép đăng nhập lại.`
        : `User ${user.email} sẽ bị chặn đăng nhập ngay lập tức. Dữ liệu vẫn được giữ nguyên.`,
      confirmLabel: willActivate ? 'Mở khoá' : 'Khoá',
      danger: !willActivate,
      onConfirm: async () => {
        setConfirm(null);
        setActingId(user.id);
        try {
          const updated = await adminService.updateUser(user.id, { isActive: willActivate });
          setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
          toast.success(willActivate ? 'Đã mở khoá' : 'Đã khoá tài khoản');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Thao tác thất bại');
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const pageNumbers = useMemo(() => {
    const max = 5;
    const start = Math.max(0, Math.min(page - 2, totalPages - max));
    const end = Math.min(totalPages, start + max);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Người Dùng</h1>
          <p className="text-gray-600 mt-1">Quản lý tài khoản, đổi gói, khoá / mở khoá</p>
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Tải lại
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo email hoặc tên..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={planCode}
            onChange={(e) => { setPlanCode(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tất cả gói</option>
            {plans.map((p) => (
              <option key={p.code} value={p.code}>{p.name || p.code}</option>
            ))}
          </select>
          <select
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khoá</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Gói</th>
                <th className="px-4 py-3">Dung lượng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tạo lúc</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Không tìm thấy user nào khớp bộ lọc
                  </td>
                </tr>
              )}
              {!loading && users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                const used = u.storageUsed || 0;
                const quota = u.totalQuotaBytes || 0;
                const pct = quota > 0 ? Math.round((used / quota) * 100) : 0;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {u.fullName?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.fullName} {isSelf && <span className="text-xs text-purple-600">(bạn)</span>}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3"><PlanBadge code={u.planCode} name={u.planName} /></td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600 mb-1">
                        {formatBytes(used)} / {formatBytes(quota)} ({pct}%)
                      </div>
                      <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge active={u.isActive} /></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <select
                          value={u.planCode || ''}
                          disabled={actingId === u.id || u.role === 'ADMIN'}
                          onChange={(e) => handleChangeTier(u, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={u.role === 'ADMIN' ? 'Không đổi gói cho admin' : 'Đổi gói'}
                        >
                          {plans.map((p) => (
                            <option key={p.code} value={p.code}>{p.name || p.code}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={actingId === u.id || isSelf}
                          className={`p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={isSelf ? 'Không khoá tài khoản đang đăng nhập' : (u.isActive ? 'Khoá' : 'Mở khoá')}
                        >
                          {u.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Trang {page + 1} / {totalPages} ({totalElements} user)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded text-sm ${
                    n === page
                      ? 'bg-purple-600 text-white'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {n + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default AdminUsers;
