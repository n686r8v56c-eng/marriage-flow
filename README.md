# Marriage Flow React — 로그인·회원가입·동기화

## GitHub 웹 업로드
압축을 풀어 `marriage-flow-react` **폴더 안에 있는 파일/폴더**를 저장소 최상위에 업로드하세요. `src/`, `index.html`, `package.json`, `supabase_setup.sql` 등이 루트에 있어야 합니다. ZIP 파일 자체를 GitHub에 올리지 마세요.

## Supabase
1. 프로젝트 대시보드 → SQL Editor → `supabase_setup.sql` 내용 전체 실행.
2. Authentication → URL Configuration에서 Cloudflare의 `https://...pages.dev` 주소를 Site URL과 Redirect URLs에 등록하세요. 이메일 인증 링크에 사용됩니다.
3. Authentication → Providers에서 Email 활성화 여부 확인.

## Cloudflare Pages (Git 연결)
- Framework: React (Vite) 또는 Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` (저장소 최상위)
- Settings → Environment variables / Variables and Secrets 에 다음을 **각각** 등록:

```
VITE_SUPABASE_URL
https://fxuwhujtfpwwveibvfdh.supabase.co

VITE_SUPABASE_PUBLISHABLE_KEY
sb_publishable_Nw-ORXd_clCofVcLBOKlCg_Q9xPBvL9
```

Production 환경에 추가하고 배포를 다시 실행하세요. Vite의 `VITE_` 변수는 브라우저에 포함되므로 `service_role` 또는 secret 키는 절대 넣지 마세요. 이 키는 공개용 publishable key입니다.

## 기능
이메일 회원가입/로그인/로그아웃/비밀번호 재설정, 작전/관계 프로젝트, 분리된 일정, JSON 백업·복원, 계정별 Supabase 저장.

## 주의
- 로그인한 사용자마다 자기 데이터만 조회/수정하도록 RLS 적용.
- 수정 후 약 0.7초 후 서버에 저장됩니다. 네트워크 실패 시 상단에 실패가 표시됩니다.
- 기기 간에는 로그인 시 최신 서버 데이터를 불러옵니다. 동시에 두 기기에서 수정하는 경우 마지막 저장이 우선할 수 있습니다.
