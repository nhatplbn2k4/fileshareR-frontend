import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import groupService from '../services/groupService';
import CoverPicker from '../components/groups/CoverPicker';
import {
  Users, Plus, Search, Globe, Lock, Crown, Shield,
  User, ArrowRight, Loader2, RefreshCw, X
} from 'lucide-react';

// ── Sub-components ────────────────────────────────────────────────────────────

const RoleBadge = ({ role }) => {
  const config = {
    OWNER:  { label: 'Chủ nhóm',  cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Crown },
    ADMIN:  { label: 'Quản trị',  cls: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
    MEMBER: { label: 'Thành viên',cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: User },
  };
  const c = config[role] || config.MEMBER;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${c.cls}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

const VisibilityBadge = ({ visibility }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
    visibility === 'PUBLIC'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-500 border-gray-200'
  }`}>
    {visibility === 'PUBLIC' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
    {visibility === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
  </span>
);

const GroupCard = ({ group, onClick }) => (
  <div
    onClick={() => onClick(group.id)}
    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-ocean-200 transition-all duration-200 cursor-pointer group overflow-hidden"
  >
    {/* Cover 16:9 */}
    <div className="relative w-full aspect-video bg-gradient-to-br from-ocean-400 to-ocean-700">
      {group.coverImageUrl && (
        <img src={group.coverImageUrl} alt="" className="w-full h-full object-cover" />
      )}
      <ArrowRight className="absolute top-3 right-3 w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
    </div>

    <div className="px-5 pb-5 pt-0 relative">
      {/* Avatar overlaps the cover from below (50% pull-up) */}
      <div className="relative z-10 -mt-8 mb-3">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white overflow-hidden">
          {group.avatarUrl
            ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" />
            : group.name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-ocean-600 transition-colors truncate">{group.name}</h3>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <VisibilityBadge visibility={group.visibility} />
          {group.myRole && <RoleBadge role={group.myRole} />}
        </div>
      </div>

      {group.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{group.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {group.memberCount} thành viên
        </span>
        <span className="text-xs text-gray-400">
          bởi <span className="font-medium text-gray-600">{group.ownerName}</span>
        </span>
      </div>
    </div>
  </div>
);

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', description: '', visibility: 'PRIVATE' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cover, setCover] = useState({ presetId: null, presetUrl: null, customBlob: null, customUrl: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Tên nhóm không được để trống');
    setLoading(true);
    try {
      // Create group với preset id nếu user chọn preset, server sẽ random pick khác nếu null
      const payload = { ...form };
      if (cover.presetId) payload.coverPresetId = cover.presetId;
      const group = await groupService.createGroup(payload);

      // Upload avatar
      if (avatarFile) {
        try { await groupService.uploadAvatar(group.id, avatarFile); } catch {}
      }
      // Upload custom cover (override preset/random)
      if (cover.customBlob) {
        try {
          const res = await groupService.uploadCover(group.id, cover.customBlob);
          group.coverImageUrl = res.coverImageUrl;
        } catch {}
      }
      onCreated(group);
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo nhóm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
        <div className="bg-gradient-to-r from-ocean-500 to-ocean-600 p-6 text-white">
          <h2 className="text-xl font-bold">Tạo nhóm mới</h2>
          <p className="text-ocean-100 text-sm mt-1">Tạo không gian chia sẻ tài liệu cho nhóm của bạn</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">{error}</div>
          )}

          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <label className="cursor-pointer relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            <div>
              <p className="text-sm font-medium text-gray-700">Avatar nhóm</p>
              <p className="text-xs text-gray-400">Click để chọn ảnh (tùy chọn)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nhập tên nhóm..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả nhóm..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Cover picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh bìa (16:9)</label>
            <p className="text-xs text-gray-500 mb-2">Để trống — hệ thống tự chọn ngẫu nhiên. Bạn có thể đổi sau.</p>
            <CoverPicker value={cover} onChange={setCover} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ nhóm</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'PUBLIC',  icon: Globe, title: 'Công khai', desc: 'Ai cũng có thể xem và tải' },
                { val: 'PRIVATE', icon: Lock,  title: 'Riêng tư',  desc: 'Chỉ thành viên mới thấy' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setForm({ ...form, visibility: opt.val })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 ${
                    form.visibility === opt.val
                      ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{opt.title}</span>
                  <span className="text-xs text-center leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >Hủy</button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg text-sm font-semibold hover:from-ocean-600 hover:to-ocean-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tạo nhóm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const Groups = () => {
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = không đang search
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mine, pub] = await Promise.all([
        groupService.getMyGroups(),
        groupService.searchPublicGroups(''),
      ]);
      setMyGroups(mine);
      setPublicGroups(pub);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      setSearchResults(await groupService.searchGroups(keyword));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => { setKeyword(''); setSearchResults(null); };

  const handleCreated = (newGroup) => {
    setMyGroups(prev => [newGroup, ...prev]);
    setShowCreateModal(false);
    navigate(`/groups/${newGroup.id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600" />
        </div>
      </MainLayout>
    );
  }

  // Filter public groups that I'm not already a member of
  const discoverGroups = publicGroups.filter(g => !g.isMember);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-8 h-8" /> Nhóm
              </h1>
              <p className="text-ocean-100">Tạo và tham gia nhóm để chia sẻ tài liệu cùng nhau</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white text-ocean-600 rounded-xl font-semibold hover:bg-ocean-50 transition shadow"
            >
              <Plus className="w-5 h-5" /> Tạo nhóm
            </button>
          </div>
        </div>

        {/* Search bar — tìm tất cả nhóm */}
        <div>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => { setKeyword(e.target.value); if (!e.target.value.trim()) setSearchResults(null); }}
                placeholder="Tìm nhóm theo tên..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              />
              {keyword && (
                <button type="button" onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" disabled={searching}
              className="px-5 py-2.5 bg-ocean-500 text-white rounded-xl text-sm font-medium hover:bg-ocean-600 transition disabled:opacity-60 flex items-center gap-2">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Tìm
            </button>
          </form>

          {/* Kết quả tìm kiếm */}
          {searchResults !== null && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-3">
                Tìm thấy <span className="font-semibold text-ocean-600">{searchResults.length}</span> nhóm cho "{keyword}"
              </p>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map(g => (
                    <GroupCard key={g.id} group={g} onClick={id => navigate(`/groups/${id}`)} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Không tìm thấy nhóm nào cho "{keyword}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Groups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-ocean-500" />
              Nhóm của tôi
              <span className="text-sm font-normal text-gray-400">({myGroups.length})</span>
            </h2>
            <button
              onClick={fetchData}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-ocean-600 transition"
            >
              <RefreshCw className="w-4 h-4" /> Làm mới
            </button>
          </div>
          {myGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Bạn chưa tham gia nhóm nào</p>
              <p className="text-gray-400 text-sm mt-1">Tạo nhóm mới hoặc tìm kiếm nhóm công khai bên dưới</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-5 py-2 bg-ocean-500 text-white rounded-lg text-sm font-medium hover:bg-ocean-600 transition"
              >
                + Tạo nhóm đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map(g => (
                <GroupCard key={g.id} group={g} onClick={id => navigate(`/groups/${id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Discover Public Groups */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-green-500" />
            Khám phá nhóm công khai
          </h2>

          {discoverGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không có nhóm công khai nào{keyword ? ` cho "${keyword}"` : ''}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoverGroups.map(g => (
                <GroupCard key={g.id} group={g} onClick={id => navigate(`/groups/${id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </MainLayout>
  );
};

export default Groups;
