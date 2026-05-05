# BILLUR ERP — v2 (Next.js + shadcn/ui)

AND BILLUR TEXTILE — Production ERP/MES system.

## Stack
- **Backend**: Node.js 20 + Express + TypeScript + PostgreSQL + qrcode
- **Frontend**: Next.js 14 + shadcn/ui + Tailwind 3 + TanStack Query + html5-qrcode
- **Database**: PostgreSQL 16

## Struktura
```
billur-erp-v2/
├── backend/         # Express API (port 3001)
├── frontend/        # Next.js app (port 3000)
└── README.md
```

## Phase 1 hozir tayyor (ishlaydi)

✅ **Login** — `/login` (admin / admin123)
✅ **Dashboard** — `/` real-time stats, stage progress, live event feed
✅ **Workers** — `/workers` CRUD + QR badge generation
✅ **QR Scan** — `/scanning` haqiqiy kamera scan + manual input

QR funksionalligi:
- Backend `/api/qr/generate/:id` PNG (data URL) bilan birga token qaytaradi
- Frontend QR rasmni darhol ko'rsatadi va chop etish uchun "Print" tugmasi bor
- `/api/qr/worker/:id/active` — mavjud QR'ni qayta ko'rish (regenerate qilmasdan)
- `/api/qr/worker/:id/png` — to'g'ridan-to'g'ri PNG fayl yuklab olish
- Browser kamera orqali scan qilish (html5-qrcode)
- Suspicious detection + supervisor approve

## Phase 2-3 (kelgusi)
- Orders, Production, Quality, Inventory, Surplus
- Boxes, Shipments, Print, Reports, Audit

Hozir bu sahifalar placeholder ko'rsatadi (backend tayyor — UI integratsiya qoldi).

## Lokal ishga tushirish

```bash
# 1. PostgreSQL
docker run -d --name billur-pg -e POSTGRES_PASSWORD=billur -p 5432:5432 postgres:16

# 2. Backend
cd backend
npm install
cp .env.example .env  # DATABASE_URL ni sozlang
npm run migrate
npm run dev           # http://localhost:3001

# 3. Frontend
cd frontend
npm install
npm run dev           # http://localhost:3000
```

Default kirish: `admin / admin123`

## Atrof-muhit o'zgaruvchilari

**backend/.env:**
```
DATABASE_URL=postgres://postgres:billur@localhost:5432/postgres
JWT_SECRET=...
QR_SECRET=...
ALLOWED_ORIGINS=http://localhost:3000
```

**frontend/.env.local** (ixtiyoriy):
```
BACKEND_URL=http://localhost:3001
```

Frontend default `BACKEND_URL` — `http://localhost:3001`. `next.config.mjs`
`/api/*` ni shu joyga proxy qiladi, shuning uchun cookie/session muammolari yo'q.

## Roadmap

- [x] **Phase 0**: Backend skeleton, RBAC
- [x] **Phase 1**: Clients, Orders backend
- [x] **Phase 2-6 backend**: Production, QR, Quality, Inventory, Surplus, Print, Boxes, Shipments, Reports, Audit
- [x] **Phase 1 frontend (Next.js)**: Login, Dashboard, Workers, Scanning + real QR
- [ ] **Phase 2 frontend**: Orders, Production, Quality, Inventory
- [ ] **Phase 3 frontend**: Boxes, Shipments, Print, Reports, Audit, Surplus

## QR Workflow

1. **Admin**: Workers sahifasida ishchini topib, QR icon bosing
2. **Modal**: PNG QR rasmi avtomatik chiqadi
3. **Print**: "Chop" tugmasi badge tayyorlash uchun yangi oyna ochadi
4. **Scan**: Ishchi cech'ga kelganda — Scanning sahifasida kamera ochiladi
5. **Auth**: Ishchi badge'ini scan qiladi → tizim worker'ni tan oladi
6. **Stage advance**: Bosqich tanlab, mahsulot QR'ini scan qilib soni kiritadi
7. **Production event**: Tizim avtomatik order_items.<stage>_qty ni yangilaydi
   va, agar kerak bo'lsa, discrepancy ochadi
