import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package, HardDrive, RefreshCw, X } from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const BYTE_UNITS = [
  { label: 'MB', value: 1024 * 1024 },
  { label: 'GB', value: 1024 * 1024 * 1024 },
  { label: 'TB', value: 1024 * 1024 * 1024 * 1024 },
];

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const formatVnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const ItemForm = ({ initial, isEdit, valueLabel, onCancel, onSubmit }) => {
  const [code, setCode] = useState(initial?.code || '');
  const [name, setName] = useState(initial?.name || '');
  const [value, setValue] = useState(initial?._value ?? '');
  const [unit, setUnit] = useState(initial?._unit || 'GB');
  const [priceVnd, setPriceVnd] = useState(initial?.priceVnd ?? '');
  const [description, setDescription] = useState(initial?.description || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bytesPerUnit = BYTE_UNITS.find((u) => u.label === unit)?.value || 1;
    const bytes = Number(value) * bytesPerUnit;
    setSubmitting(true);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        bytes,
        priceVnd: Number(priceVnd) || 0,
        description: description.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mã (code) {!isEdit && <span className="text-red-500">*</span>}</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isEdit}
          required={!isEdit}
          placeholder="VD: PREMIUM, PACK_5GB"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {isEdit && <p className="text-xs text-gray-500 mt-1">Code không đổi được sau khi tạo</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{valueLabel} <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            min="0"
            step="0.01"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {BYTE_UNITS.map((u) => (<option key={u.label} value={u.label}>{u.label}</option>))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND) <span className="text-red-500">*</span></label>
        <input
          type="number"
          value={priceVnd}
          onChange={(e) => setPriceVnd(e.target.value)}
          required
          min="0"
          step="1000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {priceVnd && <p className="text-xs text-gray-500 mt-1">{formatVnd(priceVnd)}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
          Huỷ
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
          {submitting ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  );
};

const ItemCard = ({ item, kind, onEdit, onDelete }) => {
  const bytes = kind === 'plan' ? item.quotaBytes : item.extraBytes;
  const Icon = kind === 'plan' ? Package : HardDrive;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <p className="text-xs text-gray-500 font-mono">{item.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(item)} className="p-1.5 rounded text-gray-600 hover:bg-gray-100" title="Sửa">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(item)} className="p-1.5 rounded text-red-600 hover:bg-red-50" title="Xoá">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2 text-sm flex-1">
        <div className="flex justify-between">
          <span className="text-gray-500">{kind === 'plan' ? 'Dung lượng' : 'Dung lượng thêm'}</span>
          <span className="font-medium text-gray-900">{formatBytes(bytes)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Giá</span>
          <span className="font-semibold text-purple-700">{formatVnd(item.priceVnd)}</span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-600 pt-2 border-t border-gray-100">{item.description}</p>
        )}
      </div>
    </div>
  );
};

const guessUnit = (bytes) => {
  if (!bytes) return { value: '', unit: 'GB' };
  for (const u of [...BYTE_UNITS].reverse()) {
    if (bytes >= u.value) {
      const v = bytes / u.value;
      return { value: Number.isInteger(v) ? v : Number(v.toFixed(2)), unit: u.label };
    }
  }
  return { value: bytes / (1024 * 1024), unit: 'MB' };
};

const AdminPlans = () => {
  const toast = useToast();
  const [tab, setTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // { kind, item } | { kind, item: null } for create
  const [deleting, setDeleting] = useState(null); // { kind, item }

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([adminService.listPlans(), adminService.listAddons()]);
      setPlans(p || []);
      setAddons(a || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ code, name, bytes, priceVnd, description }) => {
    const isEdit = !!editing.item;
    const kind = editing.kind;
    try {
      if (kind === 'plan') {
        const payload = { name, quotaBytes: bytes, priceVnd, description };
        if (!isEdit) payload.code = code;
        if (isEdit) {
          const updated = await adminService.updatePlan(editing.item.id, payload);
          setPlans((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          toast.success('Đã cập nhật gói');
        } else {
          const created = await adminService.createPlan(payload);
          setPlans((prev) => [...prev, created].sort((a, b) => (a.priceVnd || 0) - (b.priceVnd || 0)));
          toast.success('Đã tạo gói mới');
        }
      } else {
        const payload = { name, extraBytes: bytes, priceVnd, description };
        if (!isEdit) payload.code = code;
        if (isEdit) {
          const updated = await adminService.updateAddon(editing.item.id, payload);
          setAddons((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          toast.success('Đã cập nhật addon');
        } else {
          const created = await adminService.createAddon(payload);
          setAddons((prev) => [...prev, created].sort((a, b) => (a.priceVnd || 0) - (b.priceVnd || 0)));
          toast.success('Đã tạo addon mới');
        }
      }
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleConfirmDelete = async () => {
    const { kind, item } = deleting;
    try {
      if (kind === 'plan') {
        await adminService.deletePlan(item.id);
        setPlans((prev) => prev.filter((x) => x.id !== item.id));
        toast.success('Đã xoá gói');
      } else {
        await adminService.deleteAddon(item.id);
        setAddons((prev) => prev.filter((x) => x.id !== item.id));
        toast.success('Đã xoá addon');
      }
      setDeleting(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại');
    }
  };

  const currentItems = tab === 'plans' ? plans : addons;
  const currentKind = tab === 'plans' ? 'plan' : 'addon';

  return (
    <div>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gói & Addon</h1>
          <p className="text-gray-600 mt-1">Quản lý giá / dung lượng / mô tả gói lưu trữ</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <RefreshCw className="w-4 h-4" />
            Tải lại
          </button>
          <button
            onClick={() => setEditing({ kind: currentKind, item: null })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Tạo {tab === 'plans' ? 'gói mới' : 'addon mới'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-gray-200 inline-flex">
        <button
          onClick={() => setTab('plans')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'plans' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Gói plan ({plans.length})
        </button>
        <button
          onClick={() => setTab('addons')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'addons' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Storage addon ({addons.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          Chưa có {tab === 'plans' ? 'gói plan' : 'addon'} nào. Click "Tạo mới" để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              kind={currentKind}
              onEdit={(it) => setEditing({ kind: currentKind, item: it })}
              onDelete={(it) => setDeleting({ kind: currentKind, item: it })}
            />
          ))}
        </div>
      )}

      {/* Edit / Create modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing
          ? `${editing.item ? 'Cập nhật' : 'Tạo mới'} ${editing.kind === 'plan' ? 'gói plan' : 'storage addon'}`
          : ''}
      >
        {editing && (() => {
          const bytes = editing.item ? (editing.kind === 'plan' ? editing.item.quotaBytes : editing.item.extraBytes) : 0;
          const guess = guessUnit(bytes);
          return (
            <ItemForm
              isEdit={!!editing.item}
              valueLabel={editing.kind === 'plan' ? 'Dung lượng tổng' : 'Dung lượng thêm'}
              initial={editing.item ? { ...editing.item, _value: guess.value, _unit: guess.unit } : null}
              onCancel={() => setEditing(null)}
              onSubmit={handleSubmit}
            />
          );
        })()}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Xác nhận xoá">
        {deleting && (
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Bạn chắc chắn muốn xoá <strong className="font-semibold">{deleting.item.name}</strong> ({deleting.item.code})?
            </p>
            <p className="text-xs text-gray-500 mb-6">
              {deleting.kind === 'plan'
                ? 'Backend chặn xoá nếu còn user/group đang dùng gói này.'
                : 'Addon xoá an toàn — payment cũ giữ nguyên reference (chỉ là chuỗi code).'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Huỷ
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                Xoá
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPlans;
