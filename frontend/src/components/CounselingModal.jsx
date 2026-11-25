import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Hash,
  Phone,
  Calendar,
  Tag,
  Video,
  MessageSquare,
  FileEdit,
  ListChecks,
  Lock,
  Save,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '접수대기', label: '접수대기', color: 'amber' },
  { value: '일정확정', label: '일정확정', color: 'blue' },
  { value: '상담완료', label: '상담완료', color: 'emerald' },
  { value: '취소', label: '취소', color: 'slate' },
];

const MEMO_DELIMITER = '\n\n--- [교사 비공개 메모] ---\n';

function parseLogAndMemo(rawLog = '') {
  if (!rawLog) return { summary: '', privateMemo: '' };
  const idx = rawLog.indexOf(MEMO_DELIMITER);
  if (idx === -1) {
    return { summary: rawLog, privateMemo: '' };
  }
  return {
    summary: rawLog.slice(0, idx),
    privateMemo: rawLog.slice(idx + MEMO_DELIMITER.length),
  };
}

function combineLogAndMemo(summary, privateMemo) {
  const cleanSummary = summary.trim();
  const cleanMemo = privateMemo.trim();
  if (!cleanMemo) return cleanSummary;
  return `${cleanSummary}${MEMO_DELIMITER}${cleanMemo}`;
}

export default function CounselingModal({
  record,
  onClose,
  onSave,
  isSubmitting,
}) {
  const parsed = parseLogAndMemo(record?.counseling_log || '');

  const [status, setStatus] = useState(record?.status || '접수대기');
  const [counselingDate, setCounselingDate] = useState(record?.counseling_date || '');
  const [counselingSummary, setCounselingSummary] = useState(parsed.summary);
  const [privateMemo, setPrivateMemo] = useState(parsed.privateMemo);
  const [followUp, setFollowUp] = useState(record?.follow_up || '');

  useEffect(() => {
    if (!record) return;
    const nextParsed = parseLogAndMemo(record.counseling_log || '');
    setStatus(record.status || '접수대기');
    setCounselingDate(record.counseling_date || '');
    setCounselingSummary(nextParsed.summary);
    setPrivateMemo(nextParsed.privateMemo);
    setFollowUp(record.follow_up || '');
  }, [record]);

  if (!record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    onSave({
      id: record.id,
      status,
      counseling_date: counselingDate.trim(),
      counseling_log: combineLogAndMemo(counselingSummary, privateMemo),
      follow_up: followUp.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                {record.id}
              </span>
              <span className="text-xs text-slate-500">신청일시: {record.created_at}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {record.student_name} ({record.student_id}) 학생 상담 상세 및 일지 기록
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* 학생 사전 신청 정보 요약 박스 */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> 학번 / 이름
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {record.student_id} · {record.student_name}
                </p>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> 연락처
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">{record.contact}</p>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> 상담 분야 / 방식
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {record.category} ({record.method})
                </p>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 희망 일시
                </span>
                <p className="font-semibold text-indigo-700 mt-0.5">{record.preferred_date}</p>
              </div>
            </div>

            <div className="border-t border-slate-200/70 pt-3">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                학생 사전 고민 및 질문 내용
              </span>
              <p className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
                {record.inquiry}
              </p>
            </div>
          </div>

          {/* 진행 상태 및 실제 상담 일자 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                상담 진행 상태 변경
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const active = status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>확정 / 실제 상담 날짜 및 시간</span>
              </label>
              <input
                type="text"
                placeholder="예: 2026-11-27 14:00 (상담실 2호)"
                value={counselingDate}
                onChange={(e) => setCounselingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                학생 조회 화면의 &apos;확정/실제 상담 일자&apos;란에도 안내됩니다.
              </p>
            </div>
          </div>

          {/* 상담 내용 요약 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <FileEdit className="w-4 h-4 text-indigo-500" />
              <span>상담 일지 (상담 내용 요약)</span>
            </label>
            <textarea
              rows={4}
              placeholder="실제 진행된 상담의 주요 대화 내용, 학생의 정서 및 학업 상태 관찰 내용을 기록하세요."
              value={counselingSummary}
              onChange={(e) => setCounselingSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* 후속 조치 사항 (Action Item) */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              <span>후속 조치 사항 (Action Item / 학생 안내 사항)</span>
            </label>
            <textarea
              rows={2}
              placeholder="다음 상담 일정, 추천 학습/진로 프로그램, 학생에게 전달할 피드백 등을 작성하세요."
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* 교사 비공개 메모 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>교사 전용 비공개 메모</span>
            </label>
            <textarea
              rows={2}
              placeholder="학부모 연락 필요 여부, 외부 전문기관 연계 검토 등 교사만 열람하는 비공개 메모를 입력하세요."
              value={privateMemo}
              onChange={(e) => setPrivateMemo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-sm leading-relaxed focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* 모달 하단 버튼 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? '저장 중...' : 'Google Sheets에 저장'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
