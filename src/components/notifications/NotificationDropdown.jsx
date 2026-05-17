import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Trash2, Download, UserPlus, ShieldAlert, Settings, FileWarning, CreditCard, Users } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

// Per-type icon + accent — keeps the dropdown scannable.
const ICONS = {
  DOCUMENT_DOWNLOADED: { icon: Download, color: 'text-blue-500' },
  GROUP_JOIN_APPROVED: { icon: UserPlus, color: 'text-emerald-500' },
  GROUP_JOIN_REJECTED: { icon: ShieldAlert, color: 'text-rose-500' },
  GROUP_ROLE_CHANGED: { icon: Settings, color: 'text-indigo-500' },
  GROUP_KICKED: { icon: ShieldAlert, color: 'text-red-500' },
  GROUP_JOIN_REQUEST: { icon: UserPlus, color: 'text-amber-500' },
  GROUP_DOC_PENDING_REVIEW: { icon: FileWarning, color: 'text-amber-500' },
  PLATFORM_GROUP_CREATED: { icon: Users, color: 'text-purple-500' },
  PLATFORM_PLAN_UPGRADED: { icon: CreditCard, color: 'text-purple-500' },
  PLATFORM_ADDON_PURCHASED: { icon: CreditCard, color: 'text-purple-500' },
  GROUP_DELETED_BY_PLATFORM: { icon: ShieldAlert, color: 'text-red-500' },
  USER_BANNED_BY_PLATFORM: { icon: ShieldAlert, color: 'text-red-500' },
};

function formatRelative(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { items, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  const handleClick = async (n) => {
    if (!n.isRead) await markAsRead(n.id);
    if (n.link) {
      onClose();
      navigate(n.link);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-800">Thông báo</h3>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-xs text-ocean-600 hover:text-ocean-800 inline-flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Đọc hết
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            Chưa có thông báo nào
          </div>
        ) : (
          items.map((n) => {
            const meta = ICONS[n.type] || { icon: Settings, color: 'text-gray-400' };
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`group px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition ${
                  !n.isRead ? 'bg-ocean-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {n.title}
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-ocean-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-gray-400">
                        {formatRelative(n.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                        title="Xoá"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
