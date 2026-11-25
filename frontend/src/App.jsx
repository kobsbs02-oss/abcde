import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Streamlit } from 'streamlit-component-lib';
import {
  GraduationCap,
  ClipboardEdit,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import StudentForm from './components/StudentForm.jsx';
import StudentStatusCheck from './components/StudentStatusCheck.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

export default function App() {
  // Streamlit Python 백엔드로부터 전달받는 상태(props)
  const [stProps, setStProps] = useState({
    isAdmin: false,
    records: [],
    studentRecords: [],
    feedback: null,
    dbError: null,
  });

  // UI 탭 상태: 'apply' (학생 상담 신청) | 'status' (내 신청 내역 조회) | 'admin' (교사/관리자 대시보드)
  const [activeTab, setActiveTab] = useState('apply');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const lastFeedbackIdRef = useRef(null);
  const containerRef = useRef(null);

  // Streamlit Python 백엔드로 이벤트 전송하는 헬퍼 함수
  const sendEventToPython = useCallback((action, payload = {}) => {
    const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setIsSubmitting(true);
    Streamlit.setComponentValue({
      eventId,
      action,
      payload,
    });
    return eventId;
  }, []);

  // Streamlit RENDER_EVENT 수신 및 초기 핸드셰이크
  useEffect(() => {
    const onRender = (event) => {
      const args = event?.detail?.args || {};
      setStProps({
        isAdmin: Boolean(args.isAdmin),
        records: Array.isArray(args.records) ? args.records : [],
        studentRecords: Array.isArray(args.studentRecords) ? args.studentRecords : [],
        feedback: args.feedback || null,
        dbError: args.dbError || null,
      });
      setIsSubmitting(false);

      // Python에서 새 피드백이 도착한 경우 토스트 메시지 표시
      const fb = args.feedback;
      if (fb && fb.eventId && fb.eventId !== lastFeedbackIdRef.current) {
        lastFeedbackIdRef.current = fb.eventId;
        setToast({
          type: fb.success ? 'success' : 'error',
          message: fb.message,
          action: fb.action,
        });
      }
    };

    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);
    Streamlit.setComponentReady();
    Streamlit.setFrameHeight();

    return () => {
      Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRender);
    };
  }, []);

  // DOM 높이 변화 감지하여 Streamlit iframe 높이 자동 조절
  useEffect(() => {
    const updateHeight = () => {
      const height = containerRef.current
        ? Math.max(containerRef.current.scrollHeight + 24, 680)
        : 760;
      Streamlit.setFrameHeight(height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [activeTab, stProps, toast]);

  // 토스트 자동 닫힘 타이머
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 pb-10">
      {/* 상단 네비게이션 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                학생 상담 신청 및 기록 관리 시스템
              </h1>
              <p className="text-xs text-slate-500">
                온라인 상담 예약 접수 · 진행 현황 조회 · 교사 상담 일지 통합 관리
              </p>
            </div>
          </div>

          {/* 탭 전환 버튼 */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'apply'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardEdit className="w-4 h-4" />
              <span>상담 신청</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'status'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>신청 내역 조회</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>교사/관리자</span>
              {stProps.isAdmin && (
                <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400" title="인증됨" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* 전역 알림 토스트 */}
      {toast && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="알림 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {activeTab === 'apply' && (
          <StudentForm
            onSubmitApplication={(data) => sendEventToPython('SUBMIT_APPLICATION', data)}
            isSubmitting={isSubmitting}
            lastFeedback={stProps.feedback}
            onGoToStatusCheck={() => setActiveTab('status')}
          />
        )}

        {activeTab === 'status' && (
          <StudentStatusCheck
            onSearchStatus={(query) => sendEventToPython('CHECK_STUDENT_STATUS', query)}
            studentRecords={stProps.studentRecords}
            isSubmitting={isSubmitting}
            lastFeedback={stProps.feedback}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            isAdmin={stProps.isAdmin}
            records={stProps.records}
            dbError={stProps.dbError}
            isSubmitting={isSubmitting}
            onLogin={(password) => sendEventToPython('ADMIN_LOGIN', { password })}
            onLogout={() => sendEventToPython('ADMIN_LOGOUT')}
            onRefresh={() => sendEventToPython('REFRESH_RECORDS')}
            onUpdateRecord={(updated) => sendEventToPython('UPDATE_RECORD', updated)}
          />
        )}
      </main>
    </div>
  );
}
