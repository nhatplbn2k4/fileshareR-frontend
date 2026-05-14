import { useEffect, useState } from 'react';
import billingService from '../services/billingService';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatVnd } from '../utils/format';

/**
 * Modal nâng cấp plan / mua addon — dùng cho cả user và group.
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSuccess: (storageInfo) => void
 *  - context: 'user' | 'group'
 *  - groupId?: number  (bắt buộc nếu context='group')
 *  - currentPlanCode?: string  (để disable nút plan đang dùng)
 */
const StorageUpgradeModal = ({ open, onClose, onSuccess, context, groupId, currentPlanCode }) => {
  const [tab, setTab] = useState('plan'); // 'plan' | 'addon'
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    Promise.all([billingService.listPlans(), billingService.listAddons()])
      .then(([p, a]) => {
        if (!mounted) return;
        setPlans(p);
        setAddons(a);
      })
      .catch((e) => toast.error(e.response?.data?.message || 'Không tải được danh sách gói'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [open]);

  if (!open) return null;

  const handlePurchasePlan = async (code) => {
    setSubmittingCode(code);
    try {
      const info = context === 'group'
        ? await billingService.upgradeGroupPlan(groupId, code)
        : await billingService.upgradeUserPlan(code);
      toast.success('Nâng cấp gói thành công');
      onSuccess?.(info);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Nâng cấp gói thất bại');
    } finally {
      setSubmittingCode(null);
    }
  };

  const handlePurchaseAddon = async (code) => {
    setSubmittingCode(code);
    try {
      const info = context === 'group'
        ? await billingService.purchaseGroupAddon(groupId, code)
        : await billingService.purchaseUserAddon(code);
      toast.success('Mua thêm bộ nhớ thành công');
      onSuccess?.(info);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Mua thêm thất bại');
    } finally {
      setSubmittingCode(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {context === 'group' ? 'Nâng cấp bộ nhớ nhóm' : 'Nâng cấp bộ nhớ của bạn'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-medium ${tab === 'plan' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setTab('plan')}
          >
            Nâng cấp gói
          </button>
          <button
            className={`flex-1 py-3 font-medium ${tab === 'addon' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setTab('addon')}
          >
            Mua thêm bộ nhớ
          </button>
        </div>

        <div className="p-4">
          {loading && <div className="text-center py-6 text-gray-500">Đang tải...</div>}

          {!loading && tab === 'plan' && (
            <div className="space-y-3">
              {plans.map((p) => {
                const current = p.code === currentPlanCode;
                return (
                  <div key={p.id} className="border rounded p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.name} <span className="text-xs text-gray-500">({p.code})</span></div>
                      <div className="text-sm text-gray-600">{p.description}</div>
                      <div className="text-sm mt-1">
                        Dung lượng: <strong>{formatBytes(p.quotaBytes)}</strong> · {formatVnd(p.priceVnd)}
                      </div>
                    </div>
                    <button
                      disabled={current || submittingCode === p.code}
                      onClick={() => handlePurchasePlan(p.code)}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        current
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {current ? 'Gói hiện tại' : (submittingCode === p.code ? 'Đang xử lý...' : 'Chọn gói')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && tab === 'addon' && (
            <div className="space-y-3">
              {addons.map((a) => (
                <div key={a.id} className="border rounded p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-sm text-gray-600">{a.description}</div>
                    <div className="text-sm mt-1">
                      Thêm: <strong>{formatBytes(a.extraBytes)}</strong> · {formatVnd(a.priceVnd)}
                    </div>
                  </div>
                  <button
                    disabled={submittingCode === a.code}
                    onClick={() => handlePurchaseAddon(a.code)}
                    className="px-4 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {submittingCode === a.code ? 'Đang xử lý...' : 'Mua thêm'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4">
            Đây là giao dịch giả lập cho mục đích demo — không tính phí thật.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageUpgradeModal;
