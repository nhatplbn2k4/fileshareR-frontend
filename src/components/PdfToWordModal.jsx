import { useEffect, useMemo, useState } from 'react';
import { X, Upload, FileText, Folder, Download, Save, Crown, Zap, ArrowLeft, ChevronRight, Home } from 'lucide-react';
import documentService from '../services/documentService';
import folderService from '../services/folderService';
import convertService from '../services/convertService';
import { useToast } from '../context/ToastContext';
import { formatBytes } from '../utils/format';

const saveBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Modal "PDF sang Word".
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSaved: (savedDoc) => void   (callback khi user lưu vào folder thành công)
 *  - currentFolderId?: number       (folder hiện tại để gợi ý "Lưu vào đây")
 */
const PdfToWordModal = ({ open, onClose, onSaved, currentFolderId }) => {
  const toast = useToast();

  const [tab, setTab] = useState('upload'); // 'upload' | 'existing'
  const [engine, setEngine] = useState(null); // 'local' | 'cloudconvert'
  const [uploadFile, setUploadFile] = useState(null);

  // Explorer state (tab "existing")
  const [folders, setFolders] = useState([]);          // folders ở level hiện tại
  const [docs, setDocs] = useState([]);                // docs ở level hiện tại (đã filter PDF)
  const [allFoldersForSave, setAllFoldersForSave] = useState([]); // dùng cho dropdown "Lưu vào folder"
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loadingExplorer, setLoadingExplorer] = useState(false);

  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null); // giữ ref để xóa khi đổi folder
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || '');
  const [converting, setConverting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // Reset khi đóng/mở
  useEffect(() => {
    if (!open) return;
    setUploadFile(null);
    setSelectedDocId(null);
    setSelectedDoc(null);
    setSelectedFolderId(currentFolderId || '');
    setProgressMsg('');
    setCurrentFolder(null);
    setBreadcrumbs([]);

    convertService.getCurrentEngine()
      .then((data) => setEngine(data.engine))
      .catch(() => setEngine(null));

    folderService.getAll().then((all) => setAllFoldersForSave(all || [])).catch(() => {});
  }, [open, currentFolderId]);

  // Load folders + docs ở level hiện tại (cho tab "existing")
  useEffect(() => {
    if (!open || tab !== 'existing') return;
    let cancelled = false;
    setLoadingExplorer(true);
    const loadLevel = currentFolder
      ? Promise.all([
          folderService.getSubFolders(currentFolder.id),
          documentService.getByFolder(currentFolder.id),
        ])
      : Promise.all([
          folderService.getRootFolders(),
          documentService.getWithoutFolder(),
        ]);

    loadLevel
      .then(([subs, levelDocs]) => {
        if (cancelled) return;
        setFolders(subs || []);
        setDocs(levelDocs || []);
      })
      .catch(() => !cancelled && toast.error('Không tải được nội dung thư mục'))
      .finally(() => !cancelled && setLoadingExplorer(false));
    return () => { cancelled = true; };
  }, [open, tab, currentFolder]);

  const handleFolderOpen = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumbs([...breadcrumbs, folder]);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) { setCurrentFolder(null); setBreadcrumbs([]); }
    else { setCurrentFolder(breadcrumbs[index]); setBreadcrumbs(breadcrumbs.slice(0, index + 1)); }
  };

  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      const n = breadcrumbs.slice(0, -1);
      setBreadcrumbs(n); setCurrentFolder(n[n.length - 1]);
    } else { setCurrentFolder(null); setBreadcrumbs([]); }
  };

  const isPremium = engine === 'cloudconvert';

  const canConvert = useMemo(() => {
    if (tab === 'upload') return !!uploadFile;
    return !!selectedDocId;
  }, [tab, uploadFile, selectedDocId]);

  if (!open) return null;

  const handleDownload = async () => {
    setConverting(true);
    setProgressMsg('Đang chuyển đổi...');
    try {
      let blob, fileName;
      if (tab === 'upload') {
        blob = await convertService.convertUploadDownload(uploadFile);
        fileName = uploadFile.name.replace(/\.pdf$/i, '') + '.docx';
      } else {
        blob = await convertService.convertDocumentDownload(selectedDocId);
        fileName = (selectedDoc?.fileName || 'converted').replace(/\.pdf$/i, '') + '.docx';
      }
      saveBlob(new Blob([blob]), fileName);
      toast.success('Tải về thành công');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Chuyển đổi thất bại');
    } finally {
      setConverting(false);
      setProgressMsg('');
    }
  };

  const handleSave = async () => {
    setConverting(true);
    setProgressMsg('Đang chuyển đổi và lưu...');
    try {
      const folderId = selectedFolderId ? Number(selectedFolderId) : null;
      let saved;
      if (tab === 'upload') {
        saved = await convertService.convertUploadSave(uploadFile, folderId);
      } else {
        saved = await convertService.convertDocumentSave(selectedDocId, folderId);
      }
      toast.success('Đã lưu DOCX vào thư mục');
      onSaved?.(saved);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Chuyển đổi và lưu thất bại');
    } finally {
      setConverting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Chuyển PDF sang Word</h3>
            {engine && (
              isPremium ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  <Crown className="w-3 h-3" /> Premium · CloudConvert
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  <Zap className="w-3 h-3" /> Free · Local engine
                </span>
              )
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              tab === 'upload' ? 'border-b-2 border-ocean-500 text-ocean-600' : 'text-gray-500'
            }`}
            onClick={() => setTab('upload')}
          >
            <Upload className="w-4 h-4" /> Tải lên từ máy
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              tab === 'existing' ? 'border-b-2 border-ocean-500 text-ocean-600' : 'text-gray-500'
            }`}
            onClick={() => setTab('existing')}
          >
            <FileText className="w-4 h-4" /> Tài liệu có sẵn
          </button>
        </div>

        <div className="p-6">
          {tab === 'upload' && (
            <div>
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-ocean-400 hover:bg-ocean-50 transition cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  {uploadFile ? (
                    <div>
                      <div className="font-medium text-gray-900">{uploadFile.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatBytes(uploadFile.size)}</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700 font-medium">Click để chọn file PDF</div>
                      <div className="text-xs text-gray-500 mt-1">Hoặc kéo thả vào đây (tối đa 50 MB)</div>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                />
              </label>
            </div>
          )}

          {tab === 'existing' && (
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 mb-3 text-sm overflow-x-auto">
                {currentFolder && (
                  <button onClick={handleGoBack} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Quay lại">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className={`flex items-center gap-1 px-2 py-1 rounded ${
                    !currentFolder ? 'bg-ocean-50 text-ocean-600 font-medium' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" /> Thư mục gốc
                </button>
                {breadcrumbs.map((b, i) => (
                  <span key={b.id} className="flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <button
                      onClick={() => handleBreadcrumbClick(i)}
                      className={`px-2 py-1 rounded truncate max-w-[150px] ${
                        i === breadcrumbs.length - 1
                          ? 'bg-ocean-50 text-ocean-600 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title={b.name}
                    >
                      {b.name}
                    </button>
                  </span>
                ))}
              </div>

              {/* Explorer panel */}
              {loadingExplorer ? (
                <div className="text-center py-8 text-gray-500 text-sm">Đang tải...</div>
              ) : folders.length === 0 && docs.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm border border-gray-100 rounded-lg">
                  {currentFolder ? 'Thư mục này trống' : 'Bạn chưa có tài liệu hay thư mục nào'}
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {/* Sub-folders */}
                  {folders.map((f) => (
                    <button
                      key={`folder-${f.id}`}
                      onClick={() => handleFolderOpen(f)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                    >
                      <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                        <div className="text-xs text-gray-500">Thư mục</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}

                  {/* Docs ở level hiện tại — PDF chọn được, các loại khác disabled */}
                  {docs.map((doc) => {
                    const isPdf = doc.fileType === 'PDF';
                    return (
                      <label
                        key={`doc-${doc.id}`}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          isPdf
                            ? `cursor-pointer hover:bg-gray-50 ${selectedDocId === doc.id ? 'bg-ocean-50' : ''}`
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <input
                          type="radio"
                          name="doc-pick"
                          disabled={!isPdf}
                          checked={selectedDocId === doc.id}
                          onChange={() => { setSelectedDocId(doc.id); setSelectedDoc(doc); }}
                          className="accent-ocean-500"
                        />
                        <FileText className={`w-4 h-4 flex-shrink-0 ${isPdf ? 'text-red-500' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{doc.title}</div>
                          <div className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                            {doc.fileName} · {formatBytes(doc.fileSize)}
                            {!isPdf && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">
                                Không hỗ trợ
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedDoc && (
                <div className="mt-3 px-3 py-2 bg-ocean-50 border border-ocean-100 rounded-lg text-xs text-ocean-700 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Đã chọn: <strong className="truncate">{selectedDoc.title}</strong>
                </div>
              )}
            </div>
          )}

          {/* Folder picker (cho save) */}
          {canConvert && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lưu vào thư mục (tùy chọn)
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              >
                <option value="">— Không thuộc thư mục nào —</option>
                {allFoldersForSave.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {progressMsg && (
            <div className="mt-4 text-sm text-gray-600 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 rounded-full border-2 border-ocean-500 border-t-transparent" />
              {progressMsg}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={converting}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleDownload}
            disabled={!canConvert || converting}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-ocean-500 text-ocean-600 rounded-lg hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Tải về máy
          </button>
          <button
            onClick={handleSave}
            disabled={!canConvert || converting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Lưu vào thư mục
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfToWordModal;
