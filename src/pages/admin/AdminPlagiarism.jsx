import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Copy,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  EyeOff,
  Check,
  AlertTriangle,
  Columns2,
} from 'lucide-react';
import plagiarismService from '../../services/plagiarismService';
import { useToast } from '../../context/ToastContext';
import DocCompareModal from '../../components/DocCompareModal';

const STATUS_LABELS = {
  PENDING: { cls: 'bg-amber-100 text-amber-700', label: 'Chờ xử lý' },
  RESOLVED_KEPT: { cls: 'bg-blue-100 text-blue-700', label: 'Đã giữ' },
  RESOLVED_REMOVED: { cls: 'bg-red-100 text-red-700', label: 'Đã xóa' },
  RESOLVED_PRIVATIZED: { cls: 'bg-violet-100 text-violet-700', label: 'Đã ẩn' },
  IGNORED: { cls: 'bg-gray-100 text-gray-700', label: 'Bỏ qua' },
};

const TRIGGER_LABELS = {
  FOLDER_PUBLIC: 'Public folder',
  GROUP_PUBLIC_UPLOAD: 'Upload vào nhóm công khai',
};

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const StatusBadge = ({ s }) => {
  const cfg = STATUS_LABELS[s] || { cls: 'bg-gray-100 text-gray-700', label: s };
  return <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
};

const ScoreBadge = ({ score }) => {
  if (score == null) return <span className="text-gray-400">-</span>;
  const pct = (score * 100).toFixed(0);
  let cls = 'bg-yellow-100 text-yellow-700';
  if (score >= 0.85) cls = 'bg-red-100 text-red-700';
  else if (score >= 0.75) cls = 'bg-orange-100 text-orange-700';
  return <span className={`inline-block px-2 py-1 rounded-md text-sm font-semibold ${cls}`}>{pct}%</span>;
};

const ResolveModal = ({ open, detail, onClose, onResolved }) => {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [compareMatch, setCompareMatch] = useState(null); // match đang so sánh song song

  useEffect(() => {
    if (open) {
      setNote('');
      setAction(null);
      setConfirmAction(null);
      setCompareMatch(null);
    }
  }, [open]);

  if (!open || !detail) return null;

  const doResolve = async (a) => {
    setBusy(true);
    try {
      const updated = await plagiarismService.resolve(detail.suspectedDocumentId, a, note);
      toast.success('Đã xử lý báo cáo');
      onResolved(updated);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Không xử lý được báo cáo');
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  const actions = [
    {
      key: 'KEEP', label: 'Giữ', desc: 'Không phải đạo văn (false positive)',
      icon: Check, cls: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      key: 'PRIVATIZE', label: 'Ẩn (Private)', desc: 'Đặt tài liệu/folder về riêng tư, gỡ khỏi nhóm',
      icon: EyeOff, cls: 'bg-violet-600 hover:bg-violet-700',
    },
    {
      key: 'IGNORE', label: 'Bỏ qua', desc: 'Đánh dấu bỏ qua, không thông báo user',
      icon: X, cls: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      key: 'REMOVE', label: 'Xóa + Cảnh báo', desc: 'Xóa tài liệu, +1 cảnh báo cho user (đạt ngưỡng sẽ tự ban)',
      icon: Trash2, cls: 'bg-red-600 hover:bg-red-700',
      destructive: true,
    },
  ];

  const isReadOnly = detail.status !== 'PENDING';

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Copy className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết báo cáo đạo văn</h3>
            <StatusBadge s={detail.status} />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Suspected doc card */}
          <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50/50">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="text-xs font-semibold text-orange-700 uppercase mb-1">Tài liệu nghi vấn</div>
                <h4 className="font-semibold text-gray-900">{detail.suspectedTitle}</h4>
                <div className="text-sm text-gray-600 mt-1">
                  Chủ sở hữu: <strong>{detail.suspectedOwnerEmail || '-'}</strong>
                  {detail.suspectedOwnerWarningCount != null && detail.suspectedOwnerWarningCount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Đã cảnh báo {detail.suspectedOwnerWarningCount} lần
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Trigger: {TRIGGER_LABELS[detail.triggerType] || detail.triggerType || '-'}
                  {' • '}Phát hiện lúc {formatDate(detail.firstDetectedAt)}
                  {' • '}Max score: <ScoreBadge score={detail.maxScore} />
                </div>
              </div>
              {(() => {
                const firstInternal = (detail.matches || []).find((m) => m.matchedDocumentId);
                if (!detail.suspectedDocumentId || !firstInternal) return null;
                return (
                  <button
                    onClick={() => setCompareMatch(firstInternal)}
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Columns2 className="w-3 h-3" />
                    So sánh song song
                  </button>
                );
              })()}
            </div>
            {detail.suspectedSnippet && (
              <p className="text-xs text-gray-700 mt-2 leading-relaxed border-l-2 border-orange-300 pl-3 italic">
                "{detail.suspectedSnippet}"
              </p>
            )}
          </div>

          {/* Matches */}
          <div>
            <h5 className="font-semibold text-gray-800 mb-2">
              Trùng với {detail.matches?.length || 0} tài liệu khác
            </h5>
            <div className="space-y-2">
              {(detail.matches || []).map((m, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1">
                      {m.externalUrl ? (
                        <a
                          href={m.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-blue-600 hover:underline break-all"
                        >
                          🌐 {m.matchedTitle}
                        </a>
                      ) : (
                        <div className="font-medium text-sm text-gray-900">{m.matchedTitle}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        {m.externalUrl ? 'Nguồn internet' : `Chủ sở hữu: ${m.matchedOwnerEmail || '-'}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {m.matchedDocumentId && (
                        <button
                          onClick={() => setCompareMatch(m)}
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Columns2 className="w-3 h-3" /> So sánh
                        </button>
                      )}
                      <ScoreBadge score={m.similarityScore} />
                    </div>
                  </div>
                  {m.snippet && !m.externalUrl && (
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed border-l-2 border-gray-200 pl-2 italic">
                      "{m.snippet}"
                    </p>
                  )}
                </div>
              ))}
              {(!detail.matches || detail.matches.length === 0) && (
                <div className="text-sm text-gray-500 italic">Không còn match nào (có thể đã xóa)</div>
              )}
            </div>
          </div>

          {/* Resolution info nếu đã resolved */}
          {detail.resolvedAt && (
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-700 mb-1">Lịch sử xử lý</div>
              <div className="text-sm">
                <StatusBadge s={detail.status} />{' '}
                <span className="text-gray-600">bởi {detail.resolverEmail} lúc {formatDate(detail.resolvedAt)}</span>
              </div>
              {detail.resolutionNote && (
                <p className="text-sm text-gray-700 mt-1">Ghi chú: {detail.resolutionNote}</p>
              )}
            </div>
          )}

          {/* Action area */}
          {!isReadOnly && (
            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Lý do xử lý..."
                />
              </div>

              {confirmAction ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-gray-800 mb-3">
                    <strong>Xác nhận {actions.find((a) => a.key === confirmAction)?.label}</strong>?
                    {confirmAction === 'REMOVE' && (
                      <span className="block text-xs text-red-700 mt-1">
                        Sẽ xóa file vật lý + record DB + tăng cảnh báo cho user.
                      </span>
                    )}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmAction(null)}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => doResolve(confirmAction)}
                      disabled={busy}
                      className={`px-3 py-1.5 rounded-lg text-white text-sm ${
                        actions.find((a) => a.key === confirmAction)?.cls || 'bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      {busy ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {actions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.key}
                        onClick={() =>
                          a.destructive ? setConfirmAction(a.key) : doResolve(a.key)
                        }
                        disabled={busy}
                        className={`text-left px-3 py-2 rounded-lg text-white text-sm transition disabled:opacity-50 ${a.cls}`}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Icon className="w-4 h-4" />
                          {a.label}
                        </div>
                        <div className="text-xs opacity-90 mt-0.5">{a.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white">
            Đóng
          </button>
        </div>
      </div>
    </div>

    {compareMatch && (
      <DocCompareModal
        left={{
          id: detail.suspectedDocumentId,
          title: detail.suspectedTitle,
          fileName: detail.suspectedFileName,
          fileType: detail.suspectedFileType,
          label: 'Tài liệu nghi vấn',
        }}
        right={{
          id: compareMatch.matchedDocumentId,
          title: compareMatch.matchedTitle,
          fileName: compareMatch.matchedFileName,
          fileType: compareMatch.matchedFileType,
          label: 'Tài liệu trùng',
        }}
        onClose={() => setCompareMatch(null)}
      />
    )}
    </>
  );
};

const AdminPlagiarism = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { docId: routeDocId } = useParams();
  const [reports, setReports] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plagiarismService.list({ status, page, size });
      setReports(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (e) {
      toast.error('Không tải được danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, [page, size, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-open detail nếu URL có :docId (vd: từ notification click)
  useEffect(() => {
    if (routeDocId && !detailOpen) {
      openDetail(Number(routeDocId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeDocId]);

  const closeDetail = () => {
    setDetailOpen(false);
    if (routeDocId) navigate('/admin/plagiarism', { replace: true });
  };

  const openDetail = async (docId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await plagiarismService.getDetail(docId);
      setDetail(data);
    } catch (e) {
      toast.error('Không tải được chi tiết');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResolved = (updated) => {
    setDetail(updated);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Copy className="w-6 h-6 text-orange-500" />
            Kiểm tra Đạo Văn
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Báo cáo tự động khi user public folder hoặc upload vào nhóm công khai.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-lg border mb-4 p-2 inline-flex gap-1">
        {[
          { v: 'PENDING', label: 'Chờ xử lý' },
          { v: 'RESOLVED_REMOVED', label: 'Đã xóa' },
          { v: 'RESOLVED_PRIVATIZED', label: 'Đã ẩn' },
          { v: 'RESOLVED_KEPT', label: 'Đã giữ' },
          { v: 'IGNORED', label: 'Bỏ qua' },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => { setStatus(t.v); setPage(0); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              status === t.v
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tài liệu nghi vấn</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chủ sở hữu</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trigger</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matches</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phát hiện</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  Không có báo cáo nào với trạng thái này.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.suspectedDocumentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.suspectedTitle}</div>
                    <div className="text-xs text-gray-500">ID: {r.suspectedDocumentId}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.suspectedOwnerEmail || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {TRIGGER_LABELS[r.triggerType] || r.triggerType || '-'}
                  </td>
                  <td className="px-4 py-3"><ScoreBadge score={r.maxScore} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.matchCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(r.firstDetectedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openDetail(r.suspectedDocumentId)}
                      className="px-3 py-1.5 rounded-md text-sm bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Xem & Xử lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Trang {page + 1} / {totalPages} • Tổng {totalElements} báo cáo
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ResolveModal
        open={detailOpen}
        detail={detailLoading ? null : detail}
        onClose={closeDetail}
        onResolved={handleResolved}
      />
    </div>
  );
};

export default AdminPlagiarism;
