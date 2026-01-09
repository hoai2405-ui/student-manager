# Student Manager

## Chạy dự án (Local)

### 1) Backend (Express + MySQL)

```bash
cd be
npm install
# tạo file .env (hoặc copy từ .env.example nếu có)
npm run dev
```

API chạy tại `http://localhost:3001`.

### 2) Frontend (React + Vite)

```bash
cd fe
npm install
npm run dev
```

Mặc định FE gọi API tại `http://localhost:3001`.
Nếu muốn đổi, tạo file `fe/.env`:

```env
VITE_API_URL=http://localhost:3001
```

## Scripts

- `fe`: `npm run lint`, `npm run build`
- `be`: `npm start`, `npm run dev`
