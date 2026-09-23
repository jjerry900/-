# RAVEN2 Guild Manager — Supabase + 관리자 비밀번호

로그인 없이 사용합니다.

## 관리자 비밀번호 정책

비밀번호가 필요한 작업:
- 길드원 등록
- 길드원 삭제
- 보스 기록 등록
- 보스 기록 삭제
- 사다리 게임 전체 기능은 관리자 비밀번호 없이 누구나 사용 가능

**길드원 정보 수정은 비밀번호 없이 허용**합니다.

## 환경변수

`.env.example`을 `.env.local`로 복사:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_ADMIN_PASSWORD=원하는_관리자_비밀번호
```

Vercel에서도 Environment Variables에 동일하게 등록하세요.

> 주의: 이 버전의 관리자 비밀번호는 브라우저에서 사용하는 환경변수 기반 간단 보호입니다. 악의적인 사용자를 상대로 한 강한 보안이 필요하면 서버/Edge Function에서 비밀번호 검증을 하는 방식으로 바꾸는 것이 좋습니다.
