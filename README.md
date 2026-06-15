
# Feedback Loop

Platform umpan balik pelanggan untuk owner usaha — customisasi kuesioner, kumpulkan feedback, dan lihat rangkuman di dashboard.

## Menjalankan lokal

```bash
npm install
copy .env.example .env
# isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
```

Terminal 1 — API:

```bash
npm run dev:server
```

Terminal 2 — UI:

```bash
npm run dev
```

Buka `http://localhost:5173`

## Deploy (GitHub + Render + Netlify)

| Layanan | Host | Fungsi |
|---------|------|--------|
| **GitHub** | Repo | Source code + sync otomatis |
| **Render** | Web Service | Backend Express API |
| **Netlify** | Static Site | Frontend React (Vite) |
| **Supabase** | Cloud | Database + Auth |

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: Feedback Loop app"
git branch -M main
git remote add origin https://github.com/USERNAME/feedback-loop.git
git push -u origin main
```

### 2. Deploy backend di Render

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Connect repo GitHub
3. Render membaca `render.yaml` otomatis
4. Isi environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DEEPSEEK_API_KEY` (opsional)
   - `CORS_ORIGIN` → URL Netlify, mis. `https://feedback-loop.netlify.app`
5. Catat URL API, mis. `https://feedback-loop-api.onrender.com`
6. Cek: `https://feedback-loop-api.onrender.com/api/health`

### 3. Deploy frontend di Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Pilih repo GitHub
3. Build settings dari `netlify.toml` (otomatis)
4. Environment variable:
   - `VITE_API_URL` = URL Render backend
5. Deploy → catat URL Netlify

### 4. Finalisasi CORS

Update `CORS_ORIGIN` di Render dengan URL Netlify, lalu redeploy backend.

### 5. Supabase Auth (production)

**Authentication → URL Configuration**:

- **Site URL:** URL Netlify Anda
- **Redirect URLs:** tambahkan URL Netlify

## Environment variables

| Variable | Di mana | Keterangan |
|----------|---------|------------|
| `SUPABASE_URL` | Render | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Render | Secret — jangan expose ke frontend |
| `DEEPSEEK_API_KEY` | Render | API key DeepSeek |
| `CORS_ORIGIN` | Render | URL Netlify frontend |
| `VITE_API_URL` | Netlify | URL Render backend |
