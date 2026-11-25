"""
Google Sheets 데이터베이스 연동 모듈 (gspread + google-auth)
시트명: Counseling_Records
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import gspread
from google.oauth2.service_account import Credentials
import streamlit as st

SHEET_NAME = "Counseling_Records"

COLUMNS = [
    "id",
    "created_at",
    "student_id",
    "student_name",
    "contact",
    "preferred_date",
    "category",
    "method",
    "inquiry",
    "status",
    "counseling_date",
    "counseling_log",
    "follow_up",
]

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

KST = timezone(timedelta(hours=9))


def now_kst_str() -> str:
    """한국 표준시(KST) 기준 현재 시각 문자열 반환"""
    return datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")


def _extract_spreadsheet_id(raw_id_or_url: str) -> str:
    """Spreadsheet ID 또는 전체 URL에서 순수 ID 추출"""
    value = raw_id_or_url.strip()
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", value)
    if match:
        return match.group(1)
    return value


@st.cache_resource(ttl=300)
def _get_gspread_client() -> gspread.Client:
    """st.secrets의 GCP 서비스 계정 정보로 인증된 gspread 클라이언트 생성"""
    if "gcp_service_account" not in st.secrets:
        raise RuntimeError(
            "st.secrets에 [gcp_service_account] 설정이 없습니다. "
            ".streamlit/secrets.toml 또는 Streamlit Cloud Secrets를 확인해주세요."
        )

    sa_info = dict(st.secrets["gcp_service_account"])
    # private_key 내 이스케이프된 개행문자(\n) 정규화
    if "private_key" in sa_info and isinstance(sa_info["private_key"], str):
        sa_info["private_key"] = sa_info["private_key"].replace("\\n", "\n")

    credentials = Credentials.from_service_account_info(sa_info, scopes=SCOPES)
    return gspread.authorize(credentials)


def get_worksheet() -> gspread.Worksheet:
    """
    Counseling_Records 워크시트를 반환합니다.
    시트가 없거나 헤더(1행)가 비어 있으면 자동으로 생성/초기화합니다.
    """
    if "SPREADSHEET_ID" not in st.secrets:
        raise RuntimeError(
            "st.secrets에 SPREADSHEET_ID 설정이 없습니다. "
            "연동할 Google Spreadsheet ID를 설정해주세요."
        )

    spreadsheet_id = _extract_spreadsheet_id(str(st.secrets["SPREADSHEET_ID"]))
    client = _get_gspread_client()

    try:
        spreadsheet = client.open_by_key(spreadsheet_id)
    except gspread.SpreadsheetNotFound as exc:
        raise RuntimeError(
            f"스프레드시트(ID: {spreadsheet_id})를 찾을 수 없습니다. "
            "서비스 계정 이메일에 스프레드시트 '편집자' 권한이 공유되었는지 확인해주세요."
        ) from exc

    try:
        worksheet = spreadsheet.worksheet(SHEET_NAME)
    except gspread.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(
            title=SHEET_NAME, rows=1000, cols=len(COLUMNS)
        )
        worksheet.append_row(COLUMNS, value_input_option="USER_ENTERED")
        return worksheet

    # 1행 헤더 검증 및 자동 초기화
    existing_header = worksheet.row_values(1)
    if not existing_header:
        worksheet.append_row(COLUMNS, value_input_option="USER_ENTERED")

    return worksheet


def fetch_all_records() -> List[Dict[str, Any]]:
    """전체 상담 신청 및 기록 데이터를 최신순으로 반환"""
    ws = get_worksheet()
    all_values = ws.get_all_values()
    if len(all_values) <= 1:
        return []

    header = all_values[0]
    records: List[Dict[str, Any]] = []

    for row in all_values[1:]:
        # 행 길이가 컬럼 수보다 짧을 경우 빈 문자열로 패딩
        padded = row + [""] * max(0, len(COLUMNS) - len(row))
        item: Dict[str, Any] = {}
        for idx, col_name in enumerate(COLUMNS):
            if col_name in header:
                h_idx = header.index(col_name)
                item[col_name] = padded[h_idx] if h_idx < len(padded) else ""
            else:
                item[col_name] = padded[idx] if idx < len(padded) else ""

        # 비어있는 행 스킵
        if not item.get("id") and not item.get("student_id") and not item.get("student_name"):
            continue
        records.append(item)

    # 최신 신청순 정렬 (created_at 내림차순)
    records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return records


def fetch_student_records(student_id: str, student_name: str) -> List[Dict[str, Any]]:
    """
    학번(student_id)과 이름(student_name)이 일치하는 학생 본인의 신청 내역만 반환.
    보안을 위해 교사 전용 비공개 메모는 제외하고 반환합니다.
    """
    target_id = student_id.strip()
    target_name = student_name.strip()
    if not target_id or not target_name:
        return []

    all_records = fetch_all_records()
    matched: List[Dict[str, Any]] = []

    for rec in all_records:
        if (
            str(rec.get("student_id", "")).strip() == target_id
            and str(rec.get("student_name", "")).strip() == target_name
        ):
            # 학생 조회 시 교사 비공개 상담 일지(counseling_log)는 노출하지 않음
            safe_rec = {
                "id": rec.get("id", ""),
                "created_at": rec.get("created_at", ""),
                "student_id": rec.get("student_id", ""),
                "student_name": rec.get("student_name", ""),
                "contact": rec.get("contact", ""),
                "preferred_date": rec.get("preferred_date", ""),
                "category": rec.get("category", ""),
                "method": rec.get("method", ""),
                "inquiry": rec.get("inquiry", ""),
                "status": rec.get("status", "접수대기"),
                "counseling_date": rec.get("counseling_date", ""),
                "follow_up": rec.get("follow_up", ""),
            }
            matched.append(safe_rec)

    return matched


def create_counseling_application(payload: Dict[str, Any]) -> Dict[str, Any]:
    """신규 학생 상담 신청 내역을 Google Sheets에 추가"""
    ws = get_worksheet()

    record_id = f"CS-{datetime.now(KST).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    created_at = now_kst_str()

    new_record = {
        "id": record_id,
        "created_at": created_at,
        "student_id": str(payload.get("student_id", "")).strip(),
        "student_name": str(payload.get("student_name", "")).strip(),
        "contact": str(payload.get("contact", "")).strip(),
        "preferred_date": str(payload.get("preferred_date", "")).strip(),
        "category": str(payload.get("category", "학업/성적")).strip(),
        "method": str(payload.get("method", "대면")).strip(),
        "inquiry": str(payload.get("inquiry", "")).strip(),
        "status": "접수대기",
        "counseling_date": "",
        "counseling_log": "",
        "follow_up": "",
    }

    row_values = [new_record[col] for col in COLUMNS]
    ws.append_row(row_values, value_input_option="USER_ENTERED")
    return new_record


def update_counseling_record(record_id: str, updates: Dict[str, Any]) -> bool:
    """특정 id의 상담 상태 및 상담 일지 내용을 업데이트"""
    ws = get_worksheet()
    cell = ws.find(record_id, in_column=1)
    if cell is None:
        raise ValueError(f"해당 상담 ID({record_id})를 시트에서 찾을 수 없습니다.")

    row_idx = cell.row
    current_row = ws.row_values(row_idx)
    padded = current_row + [""] * max(0, len(COLUMNS) - len(current_row))

    updated_row: List[str] = []
    for idx, col_name in enumerate(COLUMNS):
        if col_name in updates and col_name not in ("id", "created_at"):
            updated_row.append(str(updates[col_name] if updates[col_name] is not None else ""))
        else:
            updated_row.append(padded[idx])

    end_col_letter = chr(ord("A") + len(COLUMNS) - 1)
    cell_range = f"A{row_idx}:{end_col_letter}{row_idx}"
    ws.update(values=[updated_row], range_name=cell_range, value_input_option="USER_ENTERED")
    return True


def delete_counseling_record(record_id: str) -> bool:
    """특정 id의 상담 기록 행 삭제 (필요 시 사용)"""
    ws = get_worksheet()
    cell = ws.find(record_id, in_column=1)
    if cell is None:
        raise ValueError(f"해당 상담 ID({record_id})를 시트에서 찾을 수 없습니다.")
    ws.delete_rows(cell.row)
    return True
