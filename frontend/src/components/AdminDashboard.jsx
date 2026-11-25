import React, { useMemo, useState } from 'react';
import {
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Users,
  Clock,
  CalendarCheck,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import CounselingModal from './CounselingModal.jsx';

const STATUS_FILTERS = ['전체', '접수대기', '일정확정', '상담완료', '취소'];
const CATEGORY_FILTERS = [
  '전체',
  '학업/성적',
  '진로/취업',
  '학교생활/교우관계',
  '심리/정서',
  '기타',
];

function normalizeStatus(raw) {
  if (raw === '대기' || raw === '접수대기') return '접수대기';
  if (raw === '확정' || raw === '일정확정') return '일정확정';
  if (raw === '완료' || raw === '상담완료') return '상담완료';
  if (raw === '취소') return '취소';
  return raw || '접수대기';
}

function StatusPill({ status }) {
  const s = normalizeStatus(status);
  const styles = {
    접수대기: 'bg-amber-50 text-amber-700 border-amber-200',
    일정확정: 'bg-blue-50 text-blue-700 border-blue-200',
    상담완료: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    취소: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[s] || styles['접수대기']
      }`}
    >
      {s}
    </span>
  );
}

export default function AdminDashboard({
  isAdmin,
  records,
  dbError,
  isSubmitting,
  onLogin,
  onLogout,
  onRefresh,
  onUpdateRecord,
}) {
  const [password, setPassword] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 대시보드 상단 요약 통계 계산
  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter((r) => normalizeStatus(r.status) === '접수대기').length;
    const completed = records.filter((r) => normalizeStatus(r.status) === '상담완료').length;

    // 이번 주(월~일) 예정 건수 계산 (일정확정 상태이면서 날짜가 이번 주이거나, 일정확정 전체 건수)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0(일) ~ 6(토)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeekScheduled = records.filter((r) => {
      const st = normalizeStatus(r.status);
      if (st !== '일정확정' && st !== '접수대기') return false;
      const dateStr = (r.counseling_date || r.preferred_date || '').slice(0, 10);
      const parsed = new Date(dateStr);
      if (Number.isNaN(parsed.getTime())) {
        return st === '일정확정';
      }
      return parsed >= weekStart && parsed <= weekEnd;
    }).length;

    return { total, pending, thisWeekScheduled, completed };
  }, [records]);

  // 필터 및 검색 적용된 목록
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const normalized = normalizeStatus(rec.status);
      if (statusFilter !== '전체' && normalized !== statusFilter) return false;
      if (categoryFilter !== '전체' && rec.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (rec.student_name || '').toLowerCase().includes(q);
        const matchId = (rec.student_id || '').toLowerCase().includes(q);
        const matchInquiry = (rec.inquiry || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchInquiry) return false;
      }
      return true;
    });
  }, [records, statusFilter, categoryFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // 미인증 상태: 교사/관리자 로그인 화면 렌더링
  // ---------------------------------------------------------------------------
  if (!isAdmin) {
    const handleLoginSubmit = (e) => {
      e.preventDefault();
      if (!password.trim() || isSubmitting) return;
      onLogin(password);
    };

    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-center text-slate-900">
            교사 / 관리자 인증
          </h2>
          <p className="text-sm text-center text-slate-500 mt-1.5 mb-6">
            상담 기록 열람 및 일지 관리를 위해 관리자 비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                관리자 비밀번호
              </label>
              <input
                type="password"
                required
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {isSubmitting ? '인증 확인 중...' : '관리자 대시보드 접속'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 인증 완료 상태: 대시보드 메인 화면 렌더링
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* DB 연결 오류 경고 배너 */}
      {dbError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Google Sheets 연동 오류</p>
            <p className="mt-0.5 text-xs leading-relaxed">{dbError}</p>
          </div>
        </div>
      )}

      {/* 상단 액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">상담 기록 관리 대시보드</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Google Sheets (<code className="font-mono text-indigo-600">Counseling_Records</code>) 실시간 연동 중
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* 1. 대시보드 요약 카드 4종 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">전체 신청 건수</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}건</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">접수 대기 중</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.pending}건</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">이번 주 예정</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats.thisWeekScheduled}건</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">상담 완료</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.completed}건</p>
        </div>
      </div>

      {/* 2. 필터 및 검색 컨트롤 바 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 상태별 필터 탭 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* 분야별 드롭다운 & 검색 인풋 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-8 pr-7 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORY_FILTERS.map((cat) => (
                  <option key={cat} value={cat}>
                    분야: {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="학생 이름, 학번, 고민 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 상담 신청 목록 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-4">상태</th>
                <th className="py-3.5 px-4">학번 / 이름</th>
                <th className="py-3.5 px-4">상담 분야</th>
                <th className="py-3.5 px-4">방식</th>
                <th className="py-3.5 px-4">희망 일시</th>
                <th className="py-3.5 px-4">사전 고민 요약</th>
                <th className="py-3.5 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    조건에 해당하는 상담 신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{rec.student_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{rec.student_id}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {rec.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                      {rec.method}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700">
                      <div>{rec.preferred_date}</div>
                      {rec.counseling_date && (
                        <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                          확정: {rec.counseling_date}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-600 truncate">{rec.inquiry}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(rec);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>일지/상태</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 상담 일지 작성 및 상태 업데이트 상세 모달 */}
      {selectedRecord && (
        <CounselingModal
          record={selectedRecord}
          isSubmitting={isSubmitting}
          onClose={() => setSelectedRecord(null)}
          onSave={(updatedData) => {
            onUpdateRecord(updatedData);
            setSelectedRecord(null);
          }}
        />
      )}
    </div>
  );
}
