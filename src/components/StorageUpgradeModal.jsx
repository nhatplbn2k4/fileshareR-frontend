import { useEffect, useState } from 'react';
import billingService from '../services/billingService';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatVnd } from '../utils/format';

/**
 * Modal nâng cấp plan / mua addon — dùng cho cả user và group.
 * Sau khi chọn gói/addon + provider, redirect tới cổng thanh toán.
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - context: 'user' | 'group'
 *  - groupId?: number  (bắt buộc nếu context='group')
 *  - currentPlanCode?: string  (để disable nút plan đang dùng)
 */
const StorageUpgradeModal = ({ open, onClose, context, groupId, currentPlanCode }) => {
  const [tab, setTab] = useState('plan'); // 'plan' | 'addon'
  const [provider, setProvider] = useState('VNPAY'); // 'VNPAY' | 'MOMO'
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

  const initiate = async (purchaseType, code) => {
    setSubmittingCode(code);
    try {
      const params = {
        provider,
        purchaseType,
        scope: context === 'group' ? 'GROUP' : 'USER',
        ...(purchaseType === 'PLAN' ? { planCode: code } : { addonCode: code }),
        ...(context === 'group' ? { groupId } : {}),
      };
      const res = await billingService.initiatePayment(params);
      if (res?.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        toast.error('Không nhận được URL thanh toán');
        setSubmittingCode(null);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Khởi tạo thanh toán thất bại');
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

        <div className="px-4 pt-4">
          <label className="text-sm font-medium text-gray-700">Phương thức thanh toán</label>
          <div className="flex gap-3 mt-2">
            <label className={`flex-1 border rounded p-3 cursor-pointer ${provider === 'VNPAY' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              <input type="radio" name="provider" value="VNPAY" checked={provider === 'VNPAY'} onChange={(e) => setProvider(e.target.value)} className="mr-2" />
              <span className="font-medium">VNPay</span>
            </label>
            <label className={`flex-1 border rounded p-3 cursor-pointer ${provider === 'MOMO' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              <input type="radio" name="provider" value="MOMO" checked={provider === 'MOMO'} onChange={(e) => setProvider(e.target.value)} className="mr-2" />
              <span className="font-medium">MoMo</span>
            </label>
          </div>
        </div>

        <div className="flex border-b mt-4">
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
                      onClick={() => initiate('PLAN', p.code)}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        current
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {current ? 'Gói hiện tại' : (submittingCode === p.code ? 'Đang chuyển...' : 'Thanh toán')}
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
                    onClick={() => initiate('ADDON', a.code)}
                    className="px-4 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {submittingCode === a.code ? 'Đang chuyển...' : 'Thanh toán'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4">
            Bạn sẽ được chuyển tới cổng {provider === 'VNPAY' ? 'VNPay' : 'MoMo'} để hoàn tất thanh toán (sandbox — không tính phí thật).
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageUpgradeModal;
