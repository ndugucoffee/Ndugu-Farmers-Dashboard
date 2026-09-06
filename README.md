# Ndugu Coop — Live Trading Dashboard

A static dashboard (`index.html`) that reads its numbers from `data.json`.
`data.json` is rebuilt by `scripts/build_data.py` from three Excel exports
sitting in `data/`. Nothing here needs a database or a paid service.

```
ndugu-live/
├── data/
│   ├── Batches.xlsx
│   ├── Transactions.xlsx
│   └── Ndugu_Farmer_List.xlsx
├── scripts/
│   ├── build_data.py       ← recomputes data.json from the 3 files above
│   └── requirements.txt
├── data.json                ← generated — don't hand-edit
├── index.html                ← the dashboard, fetches ./data.json
└── .github/workflows/update-and-deploy.yml   ← daily rebuild + hosting
```

## One-time setup (about 10 minutes)

1. **Create a GitHub account** if you don't have one (free) — github.com.
2. **Create a new repository**, e.g. `ndugu-dashboard`. Public is fine (there's
   no confidential data in `data.json` — see *What's in the public file*
   below); pick Private if you'd rather it not be reachable by anyone with
   the link at all, but note GitHub Pages on a private repo needs a paid plan.
3. **Upload this whole folder** to the repo — easiest way: on the repo's
   GitHub page, "Add file → Upload files", drag in everything, commit to `main`.
4. **Turn on GitHub Pages**: repo → Settings → Pages → under "Build and
   deployment", set Source to **GitHub Actions**. That's it — no branch to pick.
5. **Run the workflow once**: repo → Actions tab → "Rebuild data.json and
   deploy dashboard" → "Run workflow" → Run. Wait ~1 minute.
6. Your dashboard is now live at:
   `https://<your-username>.github.io/ndugu-dashboard/`
   (repo → Settings → Pages shows the exact URL once it's deployed).

## Daily update (the part you actually repeat)

Same manual export you already do — just change the last step:

1. Export the day's `Batches.xlsx` / `Transactions.xlsx` / `Ndugu_Farmer_List.xlsx`
   from your source system, as usual.
2. On GitHub, open the repo → `data/` folder → click each file → "Upload"
   (or drag-and-drop the 3 files onto the `data/` folder page) → commit
   directly to `main`.
3. That's it. The push automatically triggers the workflow, which
   recomputes `data.json` and republishes the site — live again in
   under a minute, no need to touch `index.html` ever.

There's also a **daily 03:00 UTC scheduled run** as a safety net, and a
manual "Run workflow" button in the Actions tab if you want to force a
refresh without re-uploading anything.

## Running it locally (optional, to preview before pushing)

```bash
pip install -r scripts/requirements.txt
python scripts/build_data.py          # writes data.json
python -m http.server 8000            # serves the folder
# open http://localhost:8000/index.html
```

(Opening `index.html` directly by double-clicking won't work — browsers
block `fetch()` on `file://` URLs. Always view it through a server, local
or hosted.)

## What's in the public `data.json`

Only aggregates: monthly/seasonal totals, buyer and district breakdowns,
field-officer stats, an anonymized top-8 growers list (name + volume, no
contact details), gender/youth percentages, and ~4,200 farmer GPS points
with no name attached. It does **not** contain national ID numbers, phone
numbers, exact birthdates, or any other field from `Ndugu_Farmer_List.xlsx`
beyond gender/age-bucket and location — those stay in your private
`data/` folder and are never written into `data.json`.

## Changing where the source data comes from later

If your source system ever gets an API, or the exports move to Google
Drive/Sheets, only `scripts/build_data.py` needs to change (swap the
`pd.read_excel(...)` lines for an API call or `pd.read_csv(<sheet URL>)`).
`index.html` and the workflow don't need to know or care.
