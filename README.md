# RAVEN2 Guild Manager

- 로그인 없음
- 모든 길드원이 같은 Supabase 데이터를 공유
- 길드원 정보 수정은 비밀번호 없이 가능
- 길드원 등록/삭제, 보스 기록 등록/삭제는 관리자 비밀번호 필요
- 사다리 게임은 비밀번호 없이 누구나 사용 가능
- 분배금 메뉴 없음

## 환경변수
`.env.example`을 기준으로 Vercel Environment Variables를 설정하세요.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_ADMIN_PASSWORD=원하는_관리자_비밀번호
```

## Supabase
`supabase/schema.sql` 전체를 Supabase SQL Editor에서 실행하세요.

> 현재 관리자 비밀번호는 클라이언트 환경변수 방식이라 강한 보안 장치가 아닙니다. 실제 운영 보안이 필요하면 서버/Edge Function 방식으로 변경해야 합니다.
