import React, { useState } from 'react';
import {
  Search,
  Hash,
  User,
  Calendar,
  Tag,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

function StatusBadge({ status }) {
  const normalized = status || '접수대기';
  if (normalized === '일정확정' || normalized === '확정') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Calendar className="w-3.5 h-3.5" />
        일정확정
      </span>
    );
  }
  if (normalized === '상담완료' || normalized === '완료') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        상담완료
      </span>
    );
  }
  if (normalized === '취소') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <XCircle className="w-3.5 h-3.5" />
        취소
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3.5 h-3.5" />
      접수대기
    </span>
  );
}

export default function StudentStatusCheck({
  onSearchStatus,
  studentRecords,
  isSubmitting,
  lastFeedback,
}) {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim() || isSubmitting) return;
    setHasSearched(true);
    onSearchStatus({
      student_id: studentId.trim(),
      student_name: studentName.trim(),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 검색 입력 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">내 상담 신청 내역 조회</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          상담 신청 시 입력한 <strong>학번</strong>과 <strong>이름</strong>을 입력하면 본인의 신청 진행 상태를 확인할 수 있습니다.
        </p>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="sr-only">학번</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="학번 입력 (예: 20261015)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="sr-only">이름</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="이름 입력 (예: 김민준)"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{isSubmitting ? '조회 중...' : '조회하기'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 조회 결과 목록 */}
      {hasSearched && !isSubmitting && (
        <div className="space-y-4">
          {studentRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700">
                일치하는 상담 신청 내역이 없습니다.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                학번과 이름을 정확히 입력했는지 다시 한 번 확인해주세요.
              </p>
            </div>
          ) : (
            studentRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                      {rec.id}
                    </span>
                    <span className="text-xs text-slate-400">신청일: {rec.created_at}</span>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Tag className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      <strong className="font-semibold">분야:</strong> {rec.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Video className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      <strong className="font-semibold">방식:</strong> {rec.method}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      <strong className="font-semibold">희망일시:</strong> {rec.preferred_date}
                    </span>
                  </div>
                </div>

                {rec.counseling_date && (
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-2.5 text-sm text-blue-900">
                    <strong>확정/실제 상담 일자:</strong> {rec.counseling_date}
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700">
                  <p className="text-xs font-semibold text-slate-500 mb-1">내가 작성한 사전 고민 내용</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{rec.inquiry}</p>
                </div>

                {rec.follow_up && (
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-sm text-emerald-900">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">
                      교사 안내 / 후속 조치 사항
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{rec.follow_up}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
