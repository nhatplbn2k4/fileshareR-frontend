import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Globe, Lock, ArrowRight, LogIn, AlertTriangle, Loader2, Check
} from 'lucide-react';
import groupService from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SharedGroupLanding = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [landing, setLanding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinedJustNow, setJoinedJustNow] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [joinAnswers, setJoinAnswers] = useState([]);

  const fetchLanding = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await groupService.getLandingByShareToken(token);
      setLanding(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Link mời không hợp lệ hoặc nhóm đã bị xóa.');
      } else {
        setError('Không thể tải thông tin nhóm. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchLanding(); }, [fetchLanding]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('returnTo', `/shared/group/${token}`);
      navigate('/login');
      return;
    }
    setJoining(true);
    try {
      if (landing?.requireApproval) {
        await groupService.submitJoinRequestByToken(token, joinAnswers.length > 0 ? joinAnswers : null);
        setRequestSent(true);
      } else {
        const group = await groupService.joinByShareToken(token);
        setJoinedJustNow(true);
        setTimeout(() => navigate(`/groups/${group.id}`), 800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thất bại');
    } finally {
      setJoining(false);
    }
  };

  const handleGoToGroup = () => {
    if (landing?.id) navigate(`/groups/${landing.id}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-ocean-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-600">Đang tải thông tin nhóm...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể truy cập</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="px-5 py-2 bg-ocean-500 text-white rounded-xl hover:bg-ocean-600 transition">
          Về trang chủ
        </button>
      </div>
    </div>
  );

  const VisibilityIcon = landing?.visibility === 'PUBLIC' ? Globe : Lock;
  const visibilityLabel = landing?.visibility === 'PUBLIC' ? 'Nhóm công khai' : 'Nhóm riêng tư';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-ocean-50 to-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {landing.avatarUrl ? (
            <img src={landing.avatarUrl} alt={landing.name}
              className="w-24 h-24 rounded-2xl mx-auto mb-4 object-cover border-4 border-ocean-100" />
          ) : (
            <div className="w-24 h-24 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-ocean-100 to-ocean-200 flex items-center justify-center">
              <Users className="w-12 h-12 text-ocean-600" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{landing.name}</h1>
          <p className="text-sm text-gray-500 mb-3">bởi {landing.ownerName}</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-600 mb-5">
            <VisibilityIcon className="w-3.5 h-3.5" /> {visibilityLabel}
            <span className="mx-1">•</span>
            <Users className="w-3.5 h-3.5" /> {landing.memberCount} thành viên
          </div>

          {landing.description && (
            <p className="text-gray-600 text-sm mb-6 whitespace-pre-wrap">{landing.description}</p>
          )}

          {joinedJustNow ? (
            <div className="flex items-center justify-center gap-2 px-5 py-3 bg-green-50 text-green-700 rounded-xl font-medium">
              <Check className="w-5 h-5" /> Đã tham gia! Đang chuyển hướng...
            </div>
          ) : requestSent || landing.hasPendingRequest ? (
            <div className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-50 text-amber-700 rounded-xl font-medium border border-amber-200">
              <Loader2 className="w-5 h-5" /> Yêu cầu đã được gửi, chờ duyệt
            </div>
          ) : landing.isMember ? (
            <button
              onClick={handleGoToGroup}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-ocean-500 text-white rounded-xl hover:bg-ocean-600 transition font-medium"
            >
              Vào nhóm <ArrowRight className="w-4 h-4" />
            </button>
          ) : !isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  sessionStorage.setItem('returnTo', `/shared/group/${token}`);
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-ocean-500 text-white rounded-xl hover:bg-ocean-600 transition font-medium mb-2"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập để tham gia
              </button>
              <p className="text-xs text-gray-400">Bạn cần đăng nhập để tham gia nhóm này</p>
            </>
          ) : (
            <div className="space-y-3">
              {landing.requireApproval && landing.joinQuestions && landing.joinQuestions.length > 0 && (
                <div className="space-y-3 text-left">
                  {landing.joinQuestions.map((q, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-gray-700 mb-1">{i + 1}. {q}</p>
                      <textarea
                        value={joinAnswers[i] || ''}
                        onChange={e => {
                          const updated = [...joinAnswers];
                          updated[i] = e.target.value;
                          setJoinAnswers(updated);
                        }}
                        placeholder="Nhập câu trả lời..."
                        rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none" />
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-xl hover:from-ocean-600 hover:to-ocean-700 transition font-medium disabled:opacity-60"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {joining ? 'Đang gửi...' : landing.requireApproval ? 'Gửi yêu cầu tham gia' : 'Tham gia nhóm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedGroupLanding;
