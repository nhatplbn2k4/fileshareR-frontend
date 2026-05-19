import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import documentService from '../services/documentService';
import folderService from '../services/folderService';
import billingService from '../services/billingService';
import {
  FileText,
  Folder,
  Download,
  HardDrive,
  Clock,
  Bell,
  Upload,
  FolderPlus,
  ShieldAlert,
  CreditCard,
  Users,
  Activity,
} from 'lucide-react';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const formatRelative = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN');
};

const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 truncate">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

// Single-click: navigate to containing folder (or doc list)
// Double-click: open inline viewer modal — matches Folders/Documents pages UX
const RecentDocument = ({ doc, onView }) => {
  const navigate = useNavigate();
  const clickTimer = useRef(null);
  const target = doc.folderId ? `/folders?folder=${doc.folderId}` : '/documents';

  const handleClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      navigate(target);
      clickTimer.current = null;
    }, 220);
  };
  const handleDoubleClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    onView(doc);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Click để mở thư mục · Double-click để xem nhanh"
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer select-none"
    >
      <div className="flex items-center space-x-3 min-w-0">
        <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-ocean-600" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{doc.title}</p>
          <p className="text-xs text-gray-500 truncate">
            {doc.fileName} · {formatRelative(doc.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right text-xs text-gray-600 flex items-center flex-shrink-0 ml-2">
        <Download className="w-3.5 h-3.5 mr-1" />
        {doc.downloadCount || 0}
      </div>
    </div>
  );
};

// Map notification type → icon + accent
const ACTIVITY_ICONS = {
  DOCUMENT_DOWNLOADED: { icon: Download, color: 'bg-blue-100 text-blue-600' },
  GROUP_JOIN_APPROVED: { icon: Users, color: 'bg-emerald-100 text-emerald-600' },
  GROUP_JOIN_REJECTED: { icon: ShieldAlert, color: 'bg-rose-100 text-rose-600' },
  GROUP_ROLE_CHANGED: { icon: Users, color: 'bg-indigo-100 text-indigo-600' },
  GROUP_KICKED: { icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
  GROUP_JOIN_REQUEST: { icon: Users, color: 'bg-amber-100 text-amber-600' },
  GROUP_DOC_PENDING_REVIEW: { icon: FileText, color: 'bg-amber-100 text-amber-600' },
  PLATFORM_PLAN_UPGRADED: { icon: CreditCard, color: 'bg-purple-100 text-purple-600' },
  PLATFORM_ADDON_PURCHASED: { icon: CreditCard, color: 'bg-purple-100 text-purple-600' },
  USER_BANNED_BY_PLATFORM: { icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
  GROUP_DELETED_BY_PLATFORM: { icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
  SYSTEM: { icon: Bell, color: 'bg-gray-100 text-gray-600' },
  SHARE: { icon: Activity, color: 'bg-ocean-100 text-ocean-600' },
};

const ActivityItem = ({ activity }) => {
  const meta = ACTIVITY_ICONS[activity.iconKey] || { icon: Activity, color: 'bg-gray-100 text-gray-600' };
  const Icon = meta.icon;
  const inner = (
    <>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
        {activity.message && (
          <p className="text-xs text-gray-500 truncate">{activity.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{formatRelative(activity.at)}</p>
      </div>
    </>
  );
  if (activity.link) {
    return (
      <Link
        to={activity.link}
        className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
      >
        {inner}
      </Link>
    );
  }
  return <div className="flex items-start space-x-3 p-2">{inner}</div>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { items: notifications } = useNotifications();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalFolders: 0,
    totalDownloads: 0,
    storageUsed: 0,
    storageQuota: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [recentFolders, setRecentFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [documents, folders, storage] = await Promise.all([
        documentService.getAll(),
        folderService.getAll(),
        billingService.getMyStorage().catch(() => null),
      ]);

      const totalDownloads = documents.reduce(
        (sum, doc) => sum + (doc.downloadCount || 0),
        0,
      );

      setStats({
        totalDocuments: documents.length,
        totalFolders: folders.length,
        totalDownloads,
        storageUsed: storage?.storageUsed ?? 0,
        storageQuota: storage?.totalQuotaBytes ?? 0,
      });

      const sortedDocs = [...documents]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
      setRecentDocuments(sortedDocs);

      const sortedFolders = [...folders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
      setRecentFolders(sortedFolders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build unified activity feed: recent docs + recent folders + notifications
  const recentActivity = useMemo(() => {
    const items = [];

    recentDocuments.slice(0, 3).forEach((doc) => {
      items.push({
        key: `doc-${doc.id}`,
        iconKey: 'SHARE',
        title: `Tải lên tài liệu "${doc.title}"`,
        message: doc.fileName,
        at: doc.createdAt,
        link: doc.folderId ? `/folders?folder=${doc.folderId}` : '/documents',
      });
    });

    recentFolders.slice(0, 3).forEach((folder) => {
      items.push({
        key: `folder-${folder.id}`,
        iconKey: 'GROUP_JOIN_APPROVED',
        title: `Tạo thư mục "${folder.name}"`,
        at: folder.createdAt,
        link: `/folders?folder=${folder.id}`,
      });
    });

    (notifications || []).slice(0, 5).forEach((n) => {
      items.push({
        key: `notif-${n.id}`,
        iconKey: n.type,
        title: n.title,
        message: n.message,
        at: n.createdAt,
        link: n.link || null,
      });
    });

    return items
      .filter((x) => x.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 7);
  }, [recentDocuments, recentFolders, notifications]);

  const storagePct = stats.storageQuota > 0
    ? Math.min(100, (stats.storageUsed / stats.storageQuota) * 100)
    : 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">
            Xin chào, {user?.fullName}! 👋
          </h1>
          <p className="text-ocean-100">
            Chào mừng bạn đến với hệ thống quản lý tài liệu
          </p>
        </div>

        {/* Stats grid — chỉ số thật, không hardcode % */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FileText}
            title="Tổng Tài Liệu"
            value={stats.totalDocuments}
            subtitle="Tài liệu cá nhân của bạn"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Folder}
            title="Tổng Thư Mục"
            value={stats.totalFolders}
            subtitle="Bao gồm thư mục con"
            color="bg-gradient-to-br from-ocean-500 to-ocean-600"
          />
          <StatCard
            icon={Download}
            title="Lượt Tải Xuống"
            value={stats.totalDownloads}
            subtitle="Cộng dồn tất cả tài liệu"
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard
            icon={HardDrive}
            title="Dung Lượng"
            value={formatBytes(stats.storageUsed)}
            subtitle={
              stats.storageQuota > 0
                ? `${storagePct.toFixed(1)}% / ${formatBytes(stats.storageQuota)}`
                : 'Đang tải...'
            }
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Storage bar */}
        {stats.storageQuota > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Sử dụng bộ nhớ</span>
              <span className="text-xs text-gray-500">
                {formatBytes(stats.storageUsed)} / {formatBytes(stats.storageQuota)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  storagePct >= 90
                    ? 'bg-red-500'
                    : storagePct >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Tài Liệu Gần Đây</h2>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-3 space-y-1">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <RecentDocument key={doc.id} doc={doc} onView={setViewingDoc} />
                ))
              ) : (
                <div className="text-center py-10">
                  <Upload className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Chưa có tài liệu nào</p>
                  <Link
                    to="/documents"
                    className="text-sm text-ocean-600 hover:text-ocean-700 font-medium mt-1 inline-block"
                  >
                    Tải lên ngay →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Activity summary — built từ docs/folders/notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Hoạt Động Gần Đây</h2>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-3 space-y-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((a) => <ActivityItem key={a.key} activity={a} />)
              ) : (
                <div className="text-center py-10">
                  <FolderPlus className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    Chưa có hoạt động. Hãy bắt đầu tải tài liệu hoặc tạo thư mục.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </MainLayout>
  );
};

export default Dashboard;
