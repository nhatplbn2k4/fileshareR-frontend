import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import documentService from '../services/documentService';
import folderService from '../services/folderService';
import {
  FileText,
  Folder,
  Download,
  TrendingUp,
  Clock,
  Eye,
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, change, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {change}
          </p>
        )}
      </div>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

const RecentDocument = ({ doc }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200">
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center">
        <FileText className="w-5 h-5 text-ocean-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{doc.title}</p>
        <p className="text-sm text-gray-500">{doc.fileName}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-600 flex items-center">
        <Download className="w-4 h-4 mr-1" />
        {doc.downloadCount}
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalFolders: 0,
    totalDownloads: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [documents, folders] = await Promise.all([
        documentService.getAll(),
        folderService.getAll(),
      ]);

      const totalDownloads = documents.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);

      setStats({
        totalDocuments: documents.length,
        totalFolders: folders.length,
        totalDownloads,
      });

      // Lấy 5 documents gần nhất
      const sorted = documents
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentDocuments(sorted);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={FileText}
            title="Tổng Tài Liệu"
            value={stats.totalDocuments}
            change="+12% so với tháng trước"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Folder}
            title="Tổng Thư Mục"
            value={stats.totalFolders}
            change="+8% so với tháng trước"
            color="bg-gradient-to-br from-ocean-500 to-ocean-600"
          />
          <StatCard
            icon={Download}
            title="Lượt Tải Xuống"
            value={stats.totalDownloads}
            change="+23% so với tháng trước"
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
        </div>

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
            <div className="p-4 space-y-2">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <RecentDocument key={doc.id} doc={doc} />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Chưa có tài liệu nào</p>
              )}
            </div>
          </div>

          {/* Activity summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Hoạt Động Gần Đây</h2>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-ocean-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload tài liệu mới</p>
                    <p className="text-xs text-gray-500">2 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tạo thư mục "Học Tập"</p>
                    <p className="text-xs text-gray-500">5 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Chia sẻ tài liệu</p>
                    <p className="text-xs text-gray-500">1 ngày trước</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
