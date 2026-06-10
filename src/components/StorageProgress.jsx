import { formatBytes } from '../utils/format';

/**
 * Thanh tiến trình hiển thị dung lượng đã dùng / tổng quota.
 * Props:
 *   - used: number (bytes) — dung lượng cá nhân đã dùng (xanh)
 *   - total: number (bytes)
 *   - allocated?: number (bytes) — dung lượng đã chia cho nhóm (vàng). >0 → bar 2 màu
 *   - planName?: string
 *   - compact?: boolean  (mini version cho sidebar)
 */
const StorageProgress = ({ used = 0, total = 0, allocated = 0, planName, compact = false }) => {
  const occupied = used + allocated;                 // đã sử dụng = cá nhân + đã chia nhóm
  const occupiedPercent = total > 0 ? Math.min(100, (occupied / total) * 100) : 0;
  const usedPercent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const allocPercent = total > 0 ? Math.min(100, (allocated / total) * 100) : 0;
  const hasAllocation = allocated > 0;
  // Màu segment cá nhân: đổi theo mức occupied; khi có phần nhóm thì giữ xanh cho rõ phân vùng
  const usedColor = hasAllocation
    ? 'bg-blue-500'
    : occupiedPercent >= 90 ? 'bg-red-500'
      : occupiedPercent >= 75 ? 'bg-yellow-500'
        : 'bg-blue-500';

  if (compact) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Bộ nhớ</span>
          <span>{Math.round(occupiedPercent)}%</span>
        </div>
        <div className="flex h-1.5 bg-gray-200 rounded overflow-hidden">
          <div className={`h-full ${usedColor}`} style={{ width: `${usedPercent}%` }} title={`Cá nhân: ${formatBytes(used)}`} />
          {hasAllocation && (
            <div className="h-full bg-yellow-400" style={{ width: `${allocPercent}%` }} title={`Đã chia nhóm: ${formatBytes(allocated)}`} />
          )}
        </div>
        <div className="text-[10px] text-gray-500 mt-1">
          {formatBytes(occupied)} / {formatBytes(total)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700">
          {planName && <span className="font-medium">Gói {planName}</span>}
        </span>
        <span className="text-sm text-gray-700">
          <strong>{formatBytes(occupied)}</strong> / {formatBytes(total)}
        </span>
      </div>
      <div className="flex h-3 bg-gray-200 rounded overflow-hidden">
        <div className={`h-full transition-all ${usedColor}`} style={{ width: `${usedPercent}%` }} title={`Cá nhân: ${formatBytes(used)}`} />
        {hasAllocation && (
          <div className="h-full transition-all bg-yellow-400" style={{ width: `${allocPercent}%` }} title={`Đã chia nhóm: ${formatBytes(allocated)}`} />
        )}
      </div>
      {hasAllocation ? (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Cá nhân {formatBytes(used)}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" /> Đã chia nhóm {formatBytes(allocated)}</span>
          </div>
          <span>{occupiedPercent.toFixed(1)}% đã dùng</span>
        </div>
      ) : (
        <div className="text-xs text-gray-500 mt-1">{occupiedPercent.toFixed(1)}% đã sử dụng</div>
      )}
    </div>
  );
};

export default StorageProgress;
