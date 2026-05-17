import React from 'react';
import { Construction } from 'lucide-react';

const AdminPlaceholder = ({ title, description }) => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-1">{description}</p>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang xây dựng</h2>
      <p className="text-gray-600 max-w-md">
        Tính năng này sẽ được phát triển trong các phase tiếp theo của trang admin.
      </p>
    </div>
  </div>
);

export default AdminPlaceholder;
