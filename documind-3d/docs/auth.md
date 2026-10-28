# Authentication Design

## Flow
1. POST /auth/register ya /auth/login -> server httpOnly cookie "documind_session" set karta hai (JWT, 7 din).
2. Browser har request ke saath cookie khud bhejta hai (fetch mein credentials: "include").
3. requireAuth cookie verify karta hai aur user ko store se load karta hai. Delete hua user foran reject.
4. Frontend start par GET /auth/me se session check karta hai. 401 -> login page.
5. POST /auth/logout cookie clear karta hai.

## Security choices
- Password: bcrypt (cost 12), max 72 chars, hash kabhi response ya log mein nahi.
- Cookie: HttpOnly (XSS se token chori nahi), SameSite=Lax, Secure (HTTPS par).
- JWT: HS256 pinned, expiry 7 din, payload mein sirf user id.
- CSRF: SameSite=Lax + Origin header check + JSON API.
- Login errors same message; email maujood na ho tab bhi bcrypt check chalta hai (timing).
- Auth responses par Cache-Control: no-store.

## Known limitations
- Stateless JWT revoke nahi hota; logout sirf browser ki cookie clear karta hai. Fix: token version ya Redis session store (Day 9+).
- Registration par 409 EMAIL_TAKEN email enumeration allow karta hai (UX ke liye jaan boojh kar). Rate limiting Day 13.
- Login rate limiting / lockout: Day 13.
- User store abhi in-memory (API restart par users gayab). Day 7 par Prisma + PostgreSQL.
- Email verification aur password reset scope mein nahi.

## Production notes
- HTTPS ke baad COOKIE_SECURE=true.
- CORS_ORIGIN web ke exact origin ke barabar hona chahiye (originCheck isi se compare karta hai).
- Same-origin deployment (Nginx /api proxy) mein cookie issues nahi aate.
