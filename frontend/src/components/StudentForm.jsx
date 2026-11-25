import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Hash,
  Phone,
  Calendar,
  Clock,
  Tag,
  Video,
  MessageSquareText,
  Send,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';

const CATEGORIES = [
  '학업/성적',
  '진로/취업',
  '학교생활/교우관계',
  '심리/정서',
  '기타',
];

const METHODS = [
  { value: '대면', label: '대면 상담', desc: '상담실 직접 방문' },
  { value: '비대면 Zoom', label: '비대면 Zoom', desc: '온라인 화상 미팅' },
  { value: '전화', label: '전화 상담', desc: '유선 통화 진행' },
];

const TIME_SLOTS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '기타 (사전 고민란에 기재)',
];

export default function StudentForm({
  onSubmitApplication,
  isSubmitting,
  lastFeedback,
  onGoToStatusCheck,
}) {
  // 기본 희망 날짜: 내일 날짜
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    contact: '',
    date_part: getTomorrowDate(),
    time_part: TIME_SLOTS[0],
    category: CATEGORIES[0],
    method: METHODS[0].value,
    inquiry: '',
  });

  const [errors, setErrors] = useState({});
  const [submittedReceipt, setSubmittedReceipt] = useState(null);
  const handledEventRef = useRef(null);

  // 제출 성공 피드백 감지 시 폼 초기화 및 접수증 카드 표시
  useEffect(() => {
    if (
      lastFeedback &&
      lastFeedback.action === 'SUBMIT_APPLICATION' &&
      lastFeedback.success &&
      lastFeedback.eventId !== handledEventRef.current
    ) {
      handledEventRef.current = lastFeedback.eventId;
      setSubmittedReceipt(lastFeedback.createdRecord || { message: lastFeedback.message });
      setFormData({
        student_id: '',
        student_name: '',
        contact: '',
        date_part: getTomorrowDate(),
        time_part: TIME_SLOTS[0],
        category: CATEGORIES[0],
        method: METHODS[0].value,
        inquiry: '',
      });
      setErrors({});
    }
  }, [lastFeedback]);

  const validate = () => {
    const nextErrors = {};
    if (!formData.student_id.trim()) nextErrors.student_id = '학번을 입력해주세요.';
    if (!formData.student_name.trim()) nextErrors.student_name = '이름을 입력해주세요.';
    if (!formData.contact.trim()) nextErrors.contact = '연락처 또는 이메일을 입력해주세요.';
    if (!formData.date_part) nextErrors.date_part = '상담 희망 날짜를 선택해주세요.';
    if (!formData.inquiry.trim()) {
      nextErrors.inquiry = '사전 질문이나 고민 내용을 간략히 작성해주세요.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const preferred_date = `${formData.date_part} (${formData.time_part})`;
    onSubmitApplication({
      student_id: formData.student_id.trim(),
      student_name: formData.student_name.trim(),
      contact: formData.contact.trim(),
      preferred_date,
      category: formData.category,
      method: formData.method,
      inquiry: formData.inquiry.trim(),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 좌측 안내 패널 */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3">
            <Info className="w-3.5 h-3.5" />
            <span>상담 신청 안내</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            편안하게 고민을 나누어 보세요
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            학업, 진로, 교우관계, 정서적 어려움 등 어떤 주제든 괜찮습니다. 신청서를 작성해 주시면 담당 교사가 확인 후 일정을 확정해 안내드립니다.
          </p>

          <div className="space-y-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-800">비밀 보장 원칙</p>
                <p className="text-slate-500 mt-0.5">
                  작성된 모든 신청 내용과 상담 기록은 철저히 비공개로 보호됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-800">일정 확정 안내</p>
                <p className="text-slate-500 mt-0.5">
                  접수 후 상단 &apos;신청 내역 조회&apos; 탭에서 학번과 이름으로 진행 상태를 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 신청 완료 접수증 카드 */}
        {submittedReceipt && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>상담 신청 접수 완료</span>
            </div>
            {submittedReceipt.id && (
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/70 text-xs space-y-1 text-slate-700 mb-3">
                <p>
                  <span className="font-semibold text-slate-500">접수번호:</span>{' '}
                  <span className="font-mono font-bold text-indigo-700">{submittedReceipt.id}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-500">신청자:</span>{' '}
                  {submittedReceipt.student_name} ({submittedReceipt.student_id})
                </p>
                <p>
                  <span className="font-semibold text-slate-500">희망일시:</span>{' '}
                  {submittedReceipt.preferred_date}
                </p>
                <p>
                  <span className="font-semibold text-slate-500">분야/방식:</span>{' '}
                  {submittedReceipt.category} · {submittedReceipt.method}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={onGoToStatusCheck}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <span>내 신청 현황 바로 조회하기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 우측 메인 상담 신청 폼 */}
      <div className="lg:col-span-2">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">학생 상담 신청서</h2>
            <p className="text-sm text-slate-500 mt-1">
              필수 항목(*)을 정확히 입력한 후 아래 제출 버튼을 눌러주세요.
            </p>
          </div>

          {/* 1. 기본 인적 사항 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <Hash className="w-4 h-4 text-indigo-500" />
                <span>학번 *</span>
              </label>
              <input
                type="text"
                placeholder="예: 20261015"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.student_id
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.student_id && (
                <p className="text-xs text-rose-600 mt-1">{errors.student_id}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                <span>이름 *</span>
              </label>
              <input
                type="text"
                placeholder="예: 김민준"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.student_name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.student_name && (
                <p className="text-xs text-rose-600 mt-1">{errors.student_name}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <Phone className="w-4 h-4 text-indigo-500" />
                <span>연락처 / 이메일 *</span>
              </label>
              <input
                type="text"
                placeholder="010-1234-5678 또는 이메일"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.contact
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.contact && (
                <p className="text-xs text-rose-600 mt-1">{errors.contact}</p>
              )}
            </div>
          </div>

          {/* 2. 상담 희망 날짜 및 시간대 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>상담 희망 날짜 *</span>
              </label>
              <input
                type="date"
                value={formData.date_part}
                onChange={(e) => setFormData({ ...formData, date_part: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.date_part
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.date_part && (
                <p className="text-xs text-rose-600 mt-1">{errors.date_part}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>희망 시간대 *</span>
              </label>
              <select
                value={formData.time_part}
                onChange={(e) => setFormData({ ...formData, time_part: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. 상담 분야 선택 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              <span>상담 분야 선택 *</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 상담 방식 선택 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <Video className="w-4 h-4 text-indigo-500" />
              <span>상담 방식 선택 *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {METHODS.map((m) => {
                const selected = formData.method === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, method: m.value })}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      selected
                        ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-100'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900">{m.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 사전 질문 및 고민 내용 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <MessageSquareText className="w-4 h-4 text-indigo-500" />
              <span>사전 질문 및 고민 내용 *</span>
            </label>
            <textarea
              rows={5}
              placeholder="상담을 통해 이야기 나누고 싶은 주제, 현재 겪고 있는 고민, 혹은 희망하는 추가 시간대 등을 자유롭게 적어주세요."
              value={formData.inquiry}
              onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border text-sm leading-relaxed transition-colors focus:outline-none focus:ring-2 ${
                errors.inquiry
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {errors.inquiry && (
              <p className="text-xs text-rose-600 mt-1">{errors.inquiry}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? '상담 신청 접수 중...' : '상담 신청서 제출하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
