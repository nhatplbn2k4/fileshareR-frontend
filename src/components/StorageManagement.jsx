import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import groupService from '../services/groupService';
import { formatBytes } from '../utils/format';
import { HardDrive, Users, ChevronRight } from 'lucide-react';

/**
 * Quản lý bộ nhớ — thanh phân vùng dung lượng cá nhân:
 *   - xanh: dung lượng cá nhân đã dùng
 *   - vàng: dung lượng đã chia (cấp) cho các nhóm
 *   - xám: còn trống
 * Bên dưới là danh sách nhóm do user làm chủ kèm dung lượng đã phân.
 *
 * Props:
 *   - storage: StorageInfoResponse của user (storageUsed, totalQuotaBytes,
 *              allocatedQuotaBytes, availableQuotaBytes)
 *   - userId: id user hiện tại (để lọc nhóm do mình làm chủ)
 */
const StorageManagement = ({ storage, userId }) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    let mounted = true;
    groupService.getMyGroups()
      .then((list) => {
        if (!mounted) return;
        const owned = (list || []).filter(
          (g) => g.myRole === 'OWNER' || g.ownerId === userId
        );
        setGroups(owned);
      })
      .catch(() => mounted && setGroups([]));
    return () => { mounted = false; };
  }, [userId, storage?.allocatedQuotaBytes]);

  if (!storage) return null;

  const total = storage.totalQuotaBytes || 0;
  const used = storage.storageUsed || 0;
  const allocated = storage.allocatedQuotaBytes || 0;
  const available = storage.availableQuotaBytes != null
    ? Math.max(0, storage.availableQuotaBytes)
    : Math.max(0, total - used - allocated);

  const pct = (v) => (total > 0 ? Math.min(100, (v / total) * 100) : 0);
  const usedPct = pct(used);
  const allocPct = pct(allocated);

  const ownedWithAlloc = (groups || []).filter((g) => (g.allocatedQuotaBytes || 0) > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <HardDrive className="w-5 h-5 mr-2 text-ocean-500" />
          Quản Lý Bộ Nhớ
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Phân bổ dung lượng giữa cá nhân và các nhóm bạn làm chủ.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Thanh phân vùng */}
        <div>
          <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${usedPct}%` }}
              title={`Cá nhân: ${formatBytes(used)}`}
            />
            <div
              className="h-full bg-yellow-400 transition-all"
              style={{ width: `${allocPct}%` }}
              title={`Đã chia nhóm: ${formatBytes(allocated)}`}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>{formatBytes(used + allocated)} đã phân bổ</span>
            <span>Tổng {formatBytes(total)}</span>
          </div>
        </div>

        {/* Chú thích */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            <div>
              <div className="text-gray-500 text-xs">Cá nhân</div>
              <div className="font-medium text-gray-900">{formatBytes(used)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-yellow-400" />
            <div>
              <div className="text-gray-500 text-xs">Đã chia nhóm</div>
              <div className="font-medium text-gray-900">{formatBytes(allocated)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300" />
            <div>
              <div className="text-gray-500 text-xs">Còn trống</div>
              <div className="font-medium text-gray-900">{formatBytes(available)}</div>
            </div>
          </div>
        </div>

        {/* Danh sách nhóm đã phân dung lượng */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" /> Nhóm bạn làm chủ
          </h3>
          {groups == null ? (
            <div className="text-sm text-gray-400">Đang tải...</div>
          ) : ownedWithAlloc.length === 0 ? (
            <div className="text-sm text-gray-400">Chưa chia dung lượng cho nhóm nào.</div>
          ) : (
            <ul className="space-y-2">
              {ownedWithAlloc.map((g) => {
                const gUsed = g.storageUsed || 0;
                const gAlloc = g.allocatedQuotaBytes || 0;
                const gPct = gAlloc > 0 ? Math.min(100, Math.round((gUsed / gAlloc) * 100)) : 0;
                return (
                  <li
                    key={g.id}
                    onClick={() => navigate(`/groups/${g.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-ocean-200 hover:bg-ocean-50/40 cursor-pointer transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                      {g.avatarUrl
                        ? <img src={g.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : (g.name?.charAt(0)?.toUpperCase() || 'G')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{g.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatBytes(gUsed)} / {formatBytes(gAlloc)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${gPct}%` }} />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageManagement;
