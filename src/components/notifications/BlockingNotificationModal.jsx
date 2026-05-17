import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

/**
 * Renders a full-screen blocking modal when the WebSocket pushes a
 * critical platform event:
 *
 *   - USER_BANNED_BY_PLATFORM → forces logout + redirect to /login
 *     after the user acknowledges.
 *   - GROUP_DELETED_BY_PLATFORM → if the user is currently viewing
 *     the affected group, redirects to /groups; otherwise just shows
 *     the modal as info that they can dismiss.
 *
 * Mounted once near the top of the route tree so it overlays anything.
 */
const BlockingNotificationModal = () => {
  const { blockingEvent, acknowledgeBlocking } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  if (!blockingEvent) return null;

  const isBan = blockingEvent.type === 'USER_BANNED_BY_PLATFORM';
  const isGroupDeleted = blockingEvent.type === 'GROUP_DELETED_BY_PLATFORM';

  const handleAck = () => {
    const ev = acknowledgeBlocking();
    // For group deletion, if user is currently inside the affected group page,
    // navigate them out. Otherwise stay where they are (acknowledge already
    // dismissed the modal).
    if (ev && ev.type === 'GROUP_DELETED_BY_PLATFORM' && ev.referenceId) {
      const groupPath = `/groups/${ev.referenceId}`;
      if (
        location.pathname === groupPath ||
        location.pathname.startsWith(`${groupPath}/`)
      ) {
        navigate('/groups');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div
          className={`px-6 py-5 ${isBan ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-gradient-to-r from-amber-500 to-orange-600'} text-white`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 flex-shrink-0" />
            <h2 className="text-lg font-bold">{blockingEvent.title}</h2>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-gray-700 text-sm leading-relaxed">
            {blockingEvent.message}
          </p>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={handleAck}
            className={`px-5 py-2 rounded-lg font-medium text-white transition ${
              isBan
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-ocean-600 hover:bg-ocean-700'
            }`}
          >
            {isBan ? 'Đăng xuất' : isGroupDeleted ? 'Đã hiểu' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockingNotificationModal;
