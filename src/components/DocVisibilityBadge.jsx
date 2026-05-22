import { Globe, Lock } from 'lucide-react';

/**
 * Badge hiển thị trạng thái tài liệu (PRIVATE / PUBLIC / SHARED).
 * Dùng chung giữa trang Documents và trang Folders để giữ ngôn ngữ trực quan
 * (xanh = công khai, xám = riêng tư).
 */
const DocVisibilityBadge = ({ value }) => {
  if (value === 'PUBLIC') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
        <Globe className="w-3 h-3" /> Công khai
      </span>
    );
  }
  if (value === 'SHARED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
        <Globe className="w-3 h-3" /> Chia sẻ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
      <Lock className="w-3 h-3" /> Riêng tư
    </span>
  );
};

export default DocVisibilityBadge;
