import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CreditCard,
  Eye,
  X,
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const formatVnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const STATUS_STYLE = {
  PENDING:   { cls: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',  label: 'Đang xử lý' },
  SUCCESS:   { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Thành công' },
  FAILED:    { cls: 'bg-red-100 text-red-700',       dot: 'bg-red-500',    label: 'Thất bại' },
  CANCELLED: { cls: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-500',   label: 'Đã huỷ' },
  EXPIRED:   { cls: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400',   label: 'Hết hạn' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || { cls: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const ProviderBadge = ({ provider }) => {
  const cls = provider === 'VNPAY' ? 'bg-blue-100 text-blue-700' : provider === 'MOMO' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700';
  return <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{provider || '-'}</span>;
};

const DetailModal = ({ payment, onClose }) => {
  if (!payment) return null;
  const rows = [
    ['Mã giao dịch', payment.txnRef],
    ['Provider TxnId', payment.providerTxnId || '-'],
    ['Provider', payment.provider],
    ['Loại mua', payment.purchaseType],
    ['Phạm vi', payment.scope],
    ['Plan code', payment.planCode || '-'],
    ['Addon code', payment.addonCode || '-'],
    ['Group ID', payment.groupId || '-'],
    ['Số tiền', formatVnd(payment.amountVnd)],
    ['Trạng thái', payment.status],
    ['Lý do thất bại', payment.failureReason || '-'],
    ['Tạo lúc', formatDateTime(payment.createdAt)],
    ['IPN nhận lúc', formatDateTime(payment.ipnReceivedAt)],
    ['User', `${payment.userFullName || ''} (${payment.userEmail || '-'})`],
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết giao dịch #{payment.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start text-sm gap-3">
              <span className="text-gray-500 w-36 flex-shrink-0">{label}</span>
              <span className="font-medium text-gray-900 break-all flex-1">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminPayments = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const [searchDraft, setSearchDraft] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchDraft); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listPayments({
        search: search || undefined,
        provider: provider || undefined,
        status: status || undefined,
        page, size,
      });
      setItems(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search, provider, status, page]);

  const totals = useMemo(() => {
    const success = items.filter((x) => x.status === 'SUCCESS').reduce((s, x) => s + (x.amountVnd || 0), 0);
    return { success };
  }, [items]);

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
          <h1 className="text-3xl font-bold text-gray-900">Giao Dịch</h1>
          <p className="text-gray-600 mt-1">Toàn bộ giao dịch VNPay / MoMo trên hệ thống</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          <RefreshCw className="w-4 h-4" />
          Tải lại
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo txnRef / providerTxnId / email user..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select value={provider} onChange={(e) => { setProvider(e.target.value); setPage(0); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Tất cả provider</option>
            <option value="VNPAY">VNPay</option>
            <option value="MOMO">MoMo</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="CANCELLED">Đã huỷ</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Tổng SUCCESS trên trang này: <strong className="text-emerald-700 font-semibold">{formatVnd(totals.success)}</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">TxnRef</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Loại / Code</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tạo lúc</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={8} className="py-12 text-center"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div></td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-500">Không có giao dịch nào</td></tr>
              )}
              {!loading && items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="font-mono text-xs text-gray-900 break-all">{p.txnRef}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{p.userFullName}</p>
                    <p className="text-xs text-gray-500">{p.userEmail}</p>
                  </td>
                  <td className="px-4 py-3"><ProviderBadge provider={p.provider} /></td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{p.purchaseType}</p>
                    <p className="text-xs text-gray-500 font-mono">{p.planCode || p.addonCode || '-'}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatVnd(p.amountVnd)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDateTime(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetail(p)}
                      className="p-1.5 rounded-md text-purple-600 hover:bg-purple-50"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Trang {page + 1} / {totalPages} ({totalElements} giao dịch)</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers.map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded text-sm ${n === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}>
                  {n + 1}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DetailModal payment={detail} onClose={() => setDetail(null)} />
    </div>
  );
};

export default AdminPayments;
