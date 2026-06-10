import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import searchService from '../services/searchService';
import {
  Search as SearchIcon, Clock, X, Trash2, FileText, Users, Loader2,
} from 'lucide-react';

/**
 * Ô tìm kiếm dùng chung — có dropdown:
 *   - khi ô trống & focus: hiện lịch sử tìm gần đây (xóa từng mục / xóa hết)
 *   - khi gõ: gọi backend autocomplete (tiêu đề tài liệu + tên nhóm)
 *
 * Props:
 *   - initialValue: giá trị khởi tạo
 *   - onSubmit(keyword): gọi khi người dùng submit (enter / click gợi ý / nút tìm)
 *   - placeholder
 *   - variant: 'page' (to) | 'navbar' (pill xám)
 *   - autoFocus
 */
const SearchBox = ({ initialValue = '', onSubmit, placeholder = 'Tìm kiếm...', variant = 'page', autoFocus = false }) => {
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(null);   // null = chưa tải
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setText(initialValue); }, [initialValue]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) { setHistory([]); return; }
    try {
      setHistory(await searchService.getHistory());
    } catch { setHistory([]); }
  }, [isAuthenticated]);

  const handleFocus = () => {
    setOpen(true);
    if (history == null) loadHistory();
  };

  // Debounced suggest khi gõ
  useEffect(() => {
    const q = text.trim();
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || !isAuthenticated) { setSuggestions([]); setLoadingSuggest(false); return; }
    setLoadingSuggest(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setSuggestions(await searchService.suggest(q));
      } catch { setSuggestions([]); }
      finally { setLoadingSuggest(false); }
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [text, isAuthenticated]);

  const submit = (keyword) => {
    const kw = (keyword ?? text).trim();
    if (!kw) return;
    setText(kw);
    setOpen(false);
    // Sau khi tìm, lịch sử sẽ thay đổi → buộc tải lại lần focus sau
    setHistory(null);
    onSubmit?.(kw);
  };

  const removeHistoryItem = async (e, id) => {
    e.stopPropagation();
    setHistory((h) => (h || []).filter((it) => it.id !== id));
    try { await searchService.deleteHistoryItem(id); } catch { /* ignore */ }
  };

  const clearAll = async (e) => {
    e.stopPropagation();
    setHistory([]);
    try { await searchService.clearHistory(); } catch { /* ignore */ }
  };

  const showingHistory = text.trim() === '';
  const items = showingHistory
    ? (history || []).map((h) => ({ key: `h${h.id}`, text: h.keyword, kind: 'history', id: h.id }))
    : suggestions.map((s, i) => ({ key: `s${i}`, text: s.text, kind: s.type }));

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) { e.preventDefault(); submit(items[activeIndex].text); }
    } else if (e.key === 'Escape') { setOpen(false); }
  };

  const isNavbar = variant === 'navbar';

  return (
    <div ref={boxRef} className={`relative ${isNavbar ? 'w-full' : 'max-w-2xl mx-auto'}`}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {isNavbar ? (
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
            <SearchIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className="bg-transparent border-none outline-none flex-1 text-sm text-gray-700 placeholder-gray-400"
            />
            {text && (
              <button type="button" onClick={() => setText('')} className="p-0.5 hover:bg-gray-200 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className="w-full pl-12 pr-32 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent shadow-sm"
            />
            <button type="submit" disabled={!text.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition disabled:opacity-50">
              Tìm kiếm
            </button>
          </div>
        )}
      </form>

      {/* Dropdown */}
      {open && (showingHistory ? (history && history.length > 0) : (loadingSuggest || items.length > 0)) && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
          {showingHistory && (
            <div className="flex items-center justify-between px-4 py-1.5">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Tìm gần đây</span>
              <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Xóa hết
              </button>
            </div>
          )}

          {!showingHistory && loadingSuggest && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tìm gợi ý...
            </div>
          )}

          {items.map((it, i) => {
            const Icon = it.kind === 'history' ? Clock : it.kind === 'GROUP' ? Users : FileText;
            return (
              <button
                key={it.key}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => submit(it.text)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition ${
                  activeIndex === i ? 'bg-ocean-50' : 'hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${it.kind === 'GROUP' ? 'text-purple-500' : it.kind === 'history' ? 'text-gray-400' : 'text-ocean-500'}`} />
                <span className="flex-1 truncate text-gray-700">{it.text}</span>
                {it.kind === 'history' && (
                  <span onClick={(e) => removeHistoryItem(e, it.id)} className="p-1 hover:bg-gray-200 rounded text-gray-300 hover:text-gray-500">
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                {it.kind === 'GROUP' && <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">Nhóm</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
