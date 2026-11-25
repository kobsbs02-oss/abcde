"""
학생 상담 신청 및 기록 관리 웹앱 (Streamlit 메인 라우터 & 커스텀 컴포넌트 브릿지)
"""

from __future__ import annotations

import hmac
import os
from typing import Any, Dict, Optional

import streamlit as st
import streamlit.components.v1 as components

from gsheets_helper import (
    create_counseling_application,
    fetch_all_records,
    fetch_student_records,
    update_counseling_record,
)

# ------------------------------------------------------------------------------
# 1. Streamlit 페이지 기본 설정
# ------------------------------------------------------------------------------
st.set_page_config(
    page_title="학생 상담 신청 및 기록 관리 시스템",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Streamlit 기본 상단 여백 및 불필요한 여백 최소화 (React UI가 화면을 깔끔하게 채우도록 구성)
st.markdown(
    """
    <style>
        .block-container {
            padding-top: 0.75rem !important;
            padding-bottom: 1rem !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            max-width: 1400px !important;
        }
        header[data-testid="stHeader"] {
            background: transparent;
        }
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
    </style>
    """,
    unsafe_allow_html=True,
)

# ------------------------------------------------------------------------------
# 2. React 빌드 정적 파일(frontend/dist) 기반 커스텀 컴포넌트 선언
# ------------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(os.path.join(FRONTEND_DIST_DIR, "index.html")):
    student_counseling_component = components.declare_component(
        "student_counseling_component",
        path=FRONTEND_DIST_DIR,
    )
else:
    student_counseling_component = None


def verify_admin_password(input_password: str) -> bool:
    """st.secrets['ADMIN_PASSWORD']와 안전하게(타이밍 공격 방지) 대조"""
    if "ADMIN_PASSWORD" not in st.secrets:
        return False
    expected = str(st.secrets["ADMIN_PASSWORD"])
    return hmac.compare_digest(str(input_password), expected)


# ------------------------------------------------------------------------------
# 3. 세션 상태 초기화
# ------------------------------------------------------------------------------
if "is_admin" not in st.session_state:
    st.session_state["is_admin"] = False

if "last_processed_event_id" not in st.session_state:
    st.session_state["last_processed_event_id"] = None

if "feedback" not in st.session_state:
    st.session_state["feedback"] = None

if "student_records" not in st.session_state:
    st.session_state["student_records"] = []

if "last_student_query" not in st.session_state:
    st.session_state["last_student_query"] = None


# ------------------------------------------------------------------------------
# 4. 빌드 미완료 시 안내 화면 처리
# ------------------------------------------------------------------------------
if student_counseling_component is None:
    st.error("⚠️ 프론트엔드 정적 빌드 폴더(`frontend/dist`)를 찾을 수 없습니다.")
    st.info(
        "로컬 터미널에서 아래 명령어를 순서대로 실행하여 React 앱을 빌드한 뒤 새로고침해주세요.\n\n"
        "```bash\n"
        "cd frontend\n"
        "npm install\n"
        "npm run build\n"
        "```"
    )
    st.stop()


# ------------------------------------------------------------------------------
# 5. Google Sheets 초기/최신 데이터 로드 (관리자 인증 상태일 때만 전체 목록 로드)
# ------------------------------------------------------------------------------
db_error: Optional[str] = None
admin_records = []

if st.session_state["is_admin"]:
    try:
        admin_records = fetch_all_records()
    except Exception as exc:
        db_error = str(exc)


# ------------------------------------------------------------------------------
# 6. React 커스텀 컴포넌트 렌더링 및 양방향 이벤트 수신
# ------------------------------------------------------------------------------
component_event: Optional[Dict[str, Any]] = student_counseling_component(
    isAdmin=st.session_state["is_admin"],
    records=admin_records if st.session_state["is_admin"] else [],
    studentRecords=st.session_state["student_records"],
    feedback=st.session_state["feedback"],
    dbError=db_error,
    key="main_counseling_bridge",
)

# ------------------------------------------------------------------------------
# 7. 프론트엔드 이벤트 라우팅 및 Google Sheets CRUD 처리
# ------------------------------------------------------------------------------
if isinstance(component_event, dict):
    event_id = component_event.get("eventId")
    action = component_event.get("action")
    payload = component_event.get("payload") or {}

    if event_id and event_id != st.session_state["last_processed_event_id"]:
        st.session_state["last_processed_event_id"] = event_id

        try:
            # [A] 학생 상담 신청 제출
            if action == "SUBMIT_APPLICATION":
                created = create_counseling_application(payload)
                st.session_state["feedback"] = {
                    "eventId": event_id,
                    "action": action,
                    "success": True,
                    "message": f"상담 신청이 완료되었습니다. (접수번호: {created['id']})",
                    "createdRecord": created,
                }
                # 관리자 로그인 상태라면 목록도 즉시 최신화
                if st.session_state["is_admin"]:
                    admin_records = fetch_all_records()

            # [B] 학생 본인 신청 내역 조회 (학번 + 이름)
            elif action == "CHECK_STUDENT_STATUS":
                s_id = str(payload.get("student_id", "")).strip()
                s_name = str(payload.get("student_name", "")).strip()
                matched = fetch_student_records(s_id, s_name)
                st.session_state["student_records"] = matched
                st.session_state["last_student_query"] = {
                    "student_id": s_id,
                    "student_name": s_name,
                }
                st.session_state["feedback"] = {
                    "eventId": event_id,
                    "action": action,
                    "success": True,
                    "message": (
                        f"총 {len(matched)}건의 상담 신청 내역이 조회되었습니다."
                        if matched
                        else "입력하신 학번과 이름에 일치하는 신청 내역이 없습니다."
                    ),
                }

            # [C] 교사/관리자 로그인 (Python 백엔드에서 비밀번호 검증)
            elif action == "ADMIN_LOGIN":
                password = str(payload.get("password", ""))
                if "ADMIN_PASSWORD" not in st.secrets:
                    st.session_state["feedback"] = {
                        "eventId": event_id,
                        "action": action,
                        "success": False,
                        "message": "서버에 ADMIN_PASSWORD 시크릿이 설정되지 않았습니다.",
                    }
                elif verify_admin_password(password):
                    st.session_state["is_admin"] = True
                    st.session_state["feedback"] = {
                        "eventId": event_id,
                        "action": action,
                        "success": True,
                        "message": "관리자 인증에 성공했습니다.",
                    }
                else:
                    st.session_state["is_admin"] = False
                    st.session_state["feedback"] = {
                        "eventId": event_id,
                        "action": action,
                        "success": False,
                        "message": "관리자 비밀번호가 올바르지 않습니다.",
                    }

            # [D] 교사/관리자 로그아웃
            elif action == "ADMIN_LOGOUT":
                st.session_state["is_admin"] = False
                st.session_state["feedback"] = {
                    "eventId": event_id,
                    "action": action,
                    "success": True,
                    "message": "관리자 모드에서 로그아웃되었습니다.",
                }

            # [E] 상담 상태 및 상담 일지 업데이트 (관리자 전용)
            elif action == "UPDATE_RECORD":
                if not st.session_state["is_admin"]:
                    raise PermissionError("관리자 권한이 필요합니다. 먼저 로그인해주세요.")

                record_id = str(payload.get("id", "")).strip()
                updates = {
                    "status": payload.get("status", "접수대기"),
                    "counseling_date": payload.get("counseling_date", ""),
                    "counseling_log": payload.get("counseling_log", ""),
                    "follow_up": payload.get("follow_up", ""),
                }
                update_counseling_record(record_id, updates)
                st.session_state["feedback"] = {
                    "eventId": event_id,
                    "action": action,
                    "success": True,
                    "message": f"상담 기록({record_id})이 성공적으로 저장되었습니다.",
                }

            # [F] 관리자 데이터 수동 새로고침
            elif action == "REFRESH_RECORDS":
                if not st.session_state["is_admin"]:
                    raise PermissionError("관리자 권한이 필요합니다.")
                st.session_state["feedback"] = {
                    "eventId": event_id,
                    "action": action,
                    "success": True,
                    "message": "최신 Google Sheets 데이터를 불러왔습니다.",
                }

        except Exception as exc:
            st.session_state["feedback"] = {
                "eventId": event_id,
                "action": action,
                "success": False,
                "message": f"처리 중 오류가 발생했습니다: {str(exc)}",
            }

        # 처리 결과를 즉시 React props로 반영하기 위해 rerun 실행
        st.rerun()
