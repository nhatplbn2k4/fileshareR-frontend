import { X, Globe, Lock } from 'lucide-react';

/**
 * Modal dùng chung cho cả Upload và Edit tài liệu — 3 field:
 *  - title (text)
 *  - folderId (select từ danh sách folders)
 *  - visibility (PRIVATE / PUBLIC)
 *
 * Lưu ý: tài liệu trong folder PUBLIC sẽ tự động bị backend ép PUBLIC,
 * nên hint dưới radio để user nắm được hành vi này.
 */
const DocFormModal = ({
  title,
  fileName,
  form,
  setForm,
  folders = [],
  loading = false,
  onClose,
  onSubmit,
  submitLabel = 'Lưu',
}) => {
  const titleValid = form.title?.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {fileName && (
            <div className="text-xs text-gray-500 truncate">
              File: <span className="text-gray-700 font-mono">{fileName}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              placeholder="Tên hiển thị của tài liệu"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thư mục</label>
            <select
              value={form.folderId || ''}
              onChange={(e) => setForm({ ...form, folderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            >
              <option value="">— Không thuộc thư mục nào —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.visibility === 'PUBLIC' ? '(Công khai)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'PRIVATE', label: 'Riêng tư', desc: 'Chỉ bạn xem được', Icon: Lock },
                { value: 'PUBLIC', label: 'Công khai', desc: 'Hiển thị cho mọi người', Icon: Globe },
              ].map(({ value, label, desc, Icon }) => {
                const active = form.visibility === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, visibility: value })}
                    className={`text-left p-3 rounded-lg border-2 transition ${
                      active
                        ? 'border-ocean-500 bg-ocean-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${active ? 'text-ocean-600' : 'text-gray-500'}`} />
                      <span
                        className={`text-sm font-semibold ${
                          active ? 'text-ocean-700' : 'text-gray-700'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Lưu ý: tài liệu trong thư mục công khai sẽ tự động đặt thành công khai.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={!titleValid || loading}
            className="px-4 py-2 text-sm bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            )}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocFormModal;
