import React, { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, Trash2, X, Loader2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import coverPresetAdminService from '../../services/coverPresetAdminService';

const AdminGroupCovers = () => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await coverPresetAdminService.listAll();
      setPresets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleActive = async (preset) => {
    try {
      const updated = await coverPresetAdminService.update(preset.id, { isActive: !preset.isActive });
      setPresets((prev) => prev.map((p) => (p.id === preset.id ? updated : p)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleRename = async (preset, newName) => {
    if (!newName || newName.trim() === preset.name) return;
    try {
      const updated = await coverPresetAdminService.update(preset.id, { name: newName.trim() });
      setPresets((prev) => prev.map((p) => (p.id === preset.id ? updated : p)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleMove = async (preset, direction) => {
    const sorted = [...presets].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const idx = sorted.findIndex((p) => p.id === preset.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    try {
      await coverPresetAdminService.update(a.id, { displayOrder: b.displayOrder ?? swapIdx });
      await coverPresetAdminService.update(b.id, { displayOrder: a.displayOrder ?? idx });
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Sắp xếp thất bại');
    }
  };

  const handleDelete = async (preset) => {
    if (!window.confirm(`Xóa preset "${preset.name}"? Các nhóm đang dùng vẫn giữ ảnh bìa hiện tại.`)) return;
    try {
      await coverPresetAdminService.remove(preset.id);
      setPresets((prev) => prev.filter((p) => p.id !== preset.id));
    } catch (err) {
      setError(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const sorted = [...presets].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ảnh bìa nhóm</h1>
          <p className="text-gray-600 mt-1">Quản lý các mẫu ảnh bìa (16:9) cho nhóm</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg font-semibold hover:from-ocean-600 hover:to-ocean-700 shadow"
        >
          <Plus className="w-4 h-4" /> Thêm preset
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-ocean-500" /></div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
          <p className="text-gray-500">Chưa có preset nào. Click "Thêm preset" để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((preset, idx) => (
            <div key={preset.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative aspect-video">
                <img src={preset.imageUrl} alt={preset.name} className="w-full h-full object-cover" />
                {!preset.isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm bg-red-500 px-3 py-1 rounded">Đã tắt</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  defaultValue={preset.name}
                  onBlur={(e) => handleRename(preset, e.target.value)}
                  className="w-full text-sm font-medium text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-ocean-500 focus:outline-none transition"
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Thứ tự: {preset.displayOrder ?? 0}</span>
                  <span>ID: {preset.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(preset)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                      preset.isActive
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {preset.isActive ? 'Đang bật' : 'Đang tắt'}
                  </button>
                  <button
                    onClick={() => handleMove(preset, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Lên"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(preset, 'down')}
                    disabled={idx === sorted.length - 1}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Xuống"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(preset)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadPresetModal
          onClose={() => setShowUpload(false)}
          onCreated={(p) => {
            setPresets((prev) => [...prev, p]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
};

const UploadPresetModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [rawSrc, setRawSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Vui lòng nhập tên');
    if (!rawSrc || !areaPixels) return setError('Vui lòng chọn + crop ảnh');
    setLoading(true);
    try {
      const blob = await cropToBlob(rawSrc, areaPixels);
      const created = await coverPresetAdminService.create(name.trim(), blob);
      onCreated(created);
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo preset thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-lg">Thêm ảnh bìa preset</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded px-3 py-2 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên preset</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Học tập, Công nghệ, Thiên nhiên..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          {!rawSrc ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="w-7 h-7 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Chọn ảnh để crop 16:9</span>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          ) : (
            <div>
              <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <Cropper
                  image={rawSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, a) => setAreaPixels(a)}
                />
              </div>
              <label className="block mt-3 text-xs text-gray-600">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >Hủy</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !rawSrc || !name.trim()}
              className="flex-1 px-4 py-2 bg-ocean-600 text-white rounded-lg text-sm font-semibold hover:bg-ocean-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tạo preset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

async function cropToBlob(src, area) {
  const image = await new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9));
}

export default AdminGroupCovers;
