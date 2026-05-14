import { formatBytes } from '../utils/format';

/**
 * Thanh tiến trình hiển thị dung lượng đã dùng / tổng quota.
 * Props:
 *   - used: number (bytes)
 *   - total: number (bytes)
 *   - planName?: string
 *   - compact?: boolean  (mini version cho sidebar)
 */
const StorageProgress = ({ used = 0, total = 0, planName, compact = false }) => {
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const barColor =
    percent >= 90 ? 'bg-red-500'
      : percent >= 75 ? 'bg-yellow-500'
      : 'bg-blue-500';

  if (compact) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Bộ nhớ</span>
          <span>{Math.round(percent)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
        </div>
        <div className="text-[10px] text-gray-500 mt-1">
          {formatBytes(used)} / {formatBytes(total)}
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
          <strong>{formatBytes(used)}</strong> / {formatBytes(total)}
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded overflow-hidden">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-1">{percent.toFixed(1)}% đã sử dụng</div>
    </div>
  );
};

export default StorageProgress;
