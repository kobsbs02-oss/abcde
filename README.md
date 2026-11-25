# 🎓 학생 상담 신청 및 기록 관리 웹앱 (React + Streamlit + Google Sheets)

**React (Vite + Tailwind CSS)** 기반의 세련된 사용자 인터페이스와 **Python Streamlit** 백엔드, 그리고 **Google Sheets** 데이터베이스를 결합한 풀스택 상담 관리 웹 애플리케이션입니다.  
**Streamlit Community Cloud** 무료 호스팅 환경에 즉시 배포할 수 있도록 설계되었습니다.

---

## 📁 프로젝트 폴더 구조

```text
student-counseling-app/
├── app.py                      # Streamlit 메인 라우터 (커스텀 컴포넌트 통신 & 인증/CRUD 제어)
├── gsheets_helper.py           # Google Sheets 연결, 시트 자동 초기화, CRUD 전담 모듈
├── requirements.txt            # Python 패키지 의존성 목록
├── .gitignore                  # secrets.toml 및 node_modules 제외 (frontend/dist는 포함!)
├── README.md                   # 설치, 빌드 및 Streamlit Cloud 배포 가이드
├── .streamlit/
│   └── secrets.toml.example    # 배포 시 입력할 시크릿 설정 템플릿
└── frontend/                   # React (Vite) 프론트엔드 프로젝트
    ├── package.json
    ├── vite.config.js          # base: './' 설정 (Streamlit iframe 상대 경로 로딩 필수)
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx             # 학생 신청 / 내역 조회 / 관리자 뷰 전환 및 Streamlit 브릿지
        └── components/
            ├── StudentForm.jsx
            ├── StudentStatusCheck.jsx
            ├── AdminDashboard.jsx
            └── CounselingModal.jsx
```

---

## ⚡ 사전 빌드 완료 안내 (`frontend/dist` 포함됨)

이 압축 파일에는 **`frontend/dist/index.html`이 이미 사전 빌드되어 포함**되어 있습니다.  
따라서 로컬 PC에 Node.js가 설치되어 있지 않더라도 **`npm install` / `npm run build` 과정 없이 바로 `streamlit run app.py` 실행 및 GitHub → Streamlit Community Cloud 배포**가 가능합니다.  
(추후 `frontend/src/` 코드를 직접 수정해 Vite로 재빌드하고 싶을 때만 `cd frontend && npm install && npm run build`를 실행하세요.)

---

## 🚀 1단계: Google Cloud Platform (GCP) 및 Google Sheets 설정

### 1. GCP 서비스 계정(Service Account) 생성 및 JSON 키 발급
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 새 프로젝트를 생성합니다.
2. 좌측 메뉴 **[API 및 서비스] → [라이브러리]**에서 아래 두 가지 API를 검색하여 **사용(Enable)** 설정합니다.
   - **Google Sheets API**
   - **Google Drive API**
3. **[API 및 서비스] → [사용자 인증 정보] → [+ 사용자 인증 정보 만들기] → [서비스 계정]**을 선택해 서비스 계정을 생성합니다.
4. 생성된 서비스 계정을 클릭 → **[키(Keys)] 탭 → [키 추가] → [새 키 만들기] → `JSON`**을 선택하여 키 파일을 다운로드합니다.

### 2. Google Spreadsheet 생성 및 권한 공유
1. [Google Sheets](https://sheets.google.com/)에서 새 스프레드시트를 만듭니다.
2. 브라우저 주소창에서 **Spreadsheet ID**를 복사해 둡니다.
   - URL 형식: `https://docs.google.com/spreadsheets/d/이_부분이_SPREADSHEET_ID_입니다/edit`
3. 우측 상단 **[공유]** 버튼을 누르고, 다운로드한 JSON 키 파일 안의 `"client_email"` 주소(`xxx@xxx.iam.gserviceaccount.com`)를 **편집자(Editor)** 권한으로 초대합니다.
4. 시트 이름(`Counseling_Records`)과 1행 헤더 컬럼은 앱 최초 실행 시 `gsheets_helper.py`가 **자동으로 생성 및 초기화**합니다.

---

## 💻 2단계: 로컬 환경 빌드 및 실행 방법

> **중요:** Streamlit Community Cloud는 배포 시 Python 패키지만 설치하며 Node.js 빌드를 자동으로 실행하지 않습니다. 따라서 **반드시 로컬에서 `npm run build`를 실행해 생성된 `frontend/dist` 폴더를 GitHub에 함께 커밋**해야 합니다.

### 1. React 프론트엔드 빌드 (`frontend/dist` 생성)
```bash
cd frontend
npm install
npm run build
cd ..
```

### 2. Python 가상환경 설정 및 Secrets 파일 생성
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

`.streamlit/secrets.toml.example` 파일을 복사하여 `.streamlit/secrets.toml`을 생성하고 실제 값을 입력합니다.
```bash
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
```

### 3. 로컬 Streamlit 앱 실행 테스트
```bash
streamlit run app.py
```

---

## ☁️ 3단계: GitHub 업로드 및 Streamlit Community Cloud 무료 배포

1. GitHub에 새 저장소(Repository)를 생성합니다.
2. `frontend/dist` 폴더가 포함되어 있는지 확인한 뒤 코드를 푸시합니다. (`.gitignore`에는 `frontend/dist`가 제외되지 않도록 이미 설정되어 있습니다.)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Student Counseling Web App"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/student-counseling-app.git
   git push -u origin main
   ```
3. [Streamlit Community Cloud](https://share.streamlit.io/)에 로그인한 뒤 **[New app]**을 클릭합니다.
   - **Repository:** 방금 올린 GitHub 저장소 선택
   - **Branch:** `main`
   - **Main file path:** `app.py`
4. **[Advanced settings...] → [Secrets]** 입력란에 로컬 `.streamlit/secrets.toml`의 전체 내용을 그대로 붙여넣습니다.
5. **[Deploy!]** 버튼을 클릭하면 몇 분 내로 무료 배포가 완료됩니다.

---

## 📊 Google Sheets 데이터 스키마 (`Counseling_Records`)

| 컬럼명 | 설명 | 예시 |
| :--- | :--- | :--- |
| `id` | 고유 접수 번호 | `CS-20261125-A1B2C3` |
| `created_at` | 신청 일시 (KST) | `2026-11-25 18:30:00` |
| `student_id` | 학번 | `20261015` |
| `student_name` | 이름 | `김민준` |
| `contact` | 연락처 또는 이메일 | `010-1234-5678` |
| `preferred_date` | 상담 희망 일시 | `2026-11-27 (14:00 - 15:00)` |
| `category` | 상담 분야 | `진로/취업` |
| `method` | 상담 방식 | `대면` / `비대면 Zoom` / `전화` |
| `inquiry` | 사전 고민 내용 | `전공 심화 및 진로 탐색 상담 희망` |
| `status` | 진행 상태 | `접수대기` / `일정확정` / `상담완료` / `취소` |
| `counseling_date` | 확정/실제 상담 일자 | `2026-11-27 14:00` |
| `counseling_log` | 상담 일지 및 교사 비공개 메모 | `진로 적성 검사 결과 리뷰...` |
| `follow_up` | 후속 조치 사항 (Action Item) | `12월 중 2차 모의면접 진행` |
