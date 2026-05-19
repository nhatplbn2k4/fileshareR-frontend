import React, { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import groupService from '../../services/groupService';

/**
 * CoverPicker — 16:9 cover image picker.
 *
 * Props:
 *  - value: { presetId?: number, customUrl?: string, customBlob?: Blob }
 *  - onChange: (next) => void
 *
 * Behavior:
 *  - Tab "Preset": shows grid of system presets (clickable)
 *  - Tab "Upload": file picker → opens 16:9 cropper → returns Blob
 *  - When preset chosen: value.presetId set, customBlob/customUrl cleared
 *  - When custom uploaded + cropped: value.customBlob = Blob, presetId cleared
 *  - Parent collects value and calls groupService.uploadCover (if customBlob) or
 *    sets coverPresetId in create/update request body.
 */
const CoverPicker = ({ value, onChange }) => {
  const [tab, setTab] = useState('preset'); // 'preset' | 'upload'
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload + crop state
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    setLoading(true);
    groupService.listCoverPresets()
      .then((data) => setPresets(Array.isArray(data) ? data : []))
      .catch(() => setPresets([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePresetClick = (preset) => {
    onChange({ presetId: preset.id, presetUrl: preset.imageUrl, customBlob: null, customUrl: null });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;
    const blob = await cropImageToBlob(rawImageSrc, croppedAreaPixels);
    const url = URL.createObjectURL(blob);
    onChange({ presetId: null, presetUrl: null, customBlob: blob, customUrl: url });
    setRawImageSrc(null);
  };

  const handleClearSelection = () => {
    onChange({ presetId: null, presetUrl: null, customBlob: null, customUrl: null });
  };

  const currentPreview = value?.customUrl || value?.presetUrl;

  return (
    <div className="space-y-3">
      {/* Current preview */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-ocean-200 to-ocean-400 border border-gray-200">
        {currentPreview ? (
          <img src={currentPreview} alt="Cover preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-white/80 text-sm">
            <ImageIcon className="w-6 h-6 mr-2" />
            <span>Chưa chọn ảnh bìa</span>
          </div>
        )}
        {currentPreview && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5"
            title="Bỏ chọn"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('preset')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'preset'
              ? 'border-ocean-500 text-ocean-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mẫu có sẵn
        </button>
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'upload'
              ? 'border-ocean-500 text-ocean-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tải lên ảnh riêng
        </button>
      </div>

      {/* Preset grid */}
      {tab === 'preset' && (
        <div>
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">Đang tải...</div>
          ) : presets.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">
              Chưa có ảnh mẫu. Hệ thống sẽ dùng nền mặc định.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {presets.map((p) => {
                const isSelected = value?.presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    className={`relative aspect-video rounded-md overflow-hidden border-2 transition ${
                      isSelected
                        ? 'border-ocean-500 ring-2 ring-ocean-300'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    title={p.name}
                  >
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-ocean-500/20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1">
                          <Check className="w-4 h-4 text-ocean-600" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload + crop */}
      {tab === 'upload' && (
        <div>
          {!rawImageSrc ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Chọn ảnh để crop 16:9</span>
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          ) : (
            <div>
              <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <Cropper
                  image={rawImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex-1 text-xs text-gray-600">
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
                <button
                  type="button"
                  onClick={() => setRawImageSrc(null)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-3 py-1.5 text-sm rounded-md bg-ocean-600 text-white hover:bg-ocean-700"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper: crop image to 16:9 blob via canvas
async function cropImageToBlob(imageSrc, area) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default CoverPicker;
