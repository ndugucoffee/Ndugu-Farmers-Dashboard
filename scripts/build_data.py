#!/usr/bin/env python3
"""
Rebuilds data.json for the Ndugu Coop dashboard from three Excel exports
placed in ../data/:
    Batches.xlsx
    Transactions.xlsx
    Ndugu_Farmer_List.xlsx

Run from the scripts/ folder:  python build_data.py
Writes ../data.json (served alongside index.html).
"""
import json
import os
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "..", "data")
OUT_PATH = os.path.join(HERE, "..", "data.json")

DISTRICTS_ORDER = ["Masaka","Bukomansimbi","Rakai","Kyotera","Mukono",
                    "Ntungamo","Lwengo","Luuka","Luwero","Kalangala"]

def parse_dob(v):
    if isinstance(v, pd.Timestamp):
        return v
    try:
        return pd.to_datetime(v, format="%d/%m/%Y")
    except Exception:
        try:
            return pd.to_datetime(v)
        except Exception:
            return pd.NaT

def is_num(v):
    try:
        float(v)
        return True
    except Exception:
        return False

def main():
    b = pd.read_excel(os.path.join(DATA_DIR, "Batches.xlsx"))
    t = pd.read_excel(os.path.join(DATA_DIR, "Transactions.xlsx"))
    t.columns = [c.strip() for c in t.columns]
    f = pd.read_excel(os.path.join(DATA_DIR, "Ndugu_Farmer_List.xlsx"))

    t["district"] = t["Location"].str.split(",").apply(lambda x: x[-1].strip())

    # ---- batch-level linkage for margin ----
    bg = b.groupby("Harvest-batch-Id").agg(
        b_qty=("Quantity", "sum"), b_amt=("Total-Paid", "sum")).reset_index()
    tg = t.groupby("Batch-Number").agg(
        t_qty=("Quantity-(Kg)", "sum"), t_amt=("Total-Amount", "sum"),
        season=("Season", "first")).reset_index()
    bt = bg.merge(tg, left_on="Harvest-batch-Id", right_on="Batch-Number", how="inner")
    bt["margin"] = bt["b_amt"] - bt["t_amt"]

    # ---- KPIs ----
    kpis = dict(
        total_qty=int(t["Quantity-(Kg)"].sum()),
        total_paid_farmers=int(t["Total-Amount"].sum()),
        total_revenue=int(b["Total-Paid"].sum()),
        total_margin=int(bt["margin"].sum()),
        n_farmers=int(t["Farmer-code"].nunique()),
        n_transactions=int(len(t)),
        n_batches=int(b["Harvest-batch-Id"].nunique()),
        avg_price_kg=round(float(t["Total-Amount"].sum()/t["Quantity-(Kg)"].sum()), 1),
        margin_per_kg=round(float(bt["margin"].sum()/t["Quantity-(Kg)"].sum()), 1),
        date_min=str(t["Transaction-Date"].min().date()),
        date_max=str(t["Transaction-Date"].max().date()),
        n_officers=int(t["Field-Officer"].nunique()),
        n_districts=int(t["district"].nunique()),
    )

    # ---- monthly trend ----
    t["month"] = t["Transaction-Date"].dt.to_period("M").astype(str)
    mg = t.groupby("month").agg(qty=("Quantity-(Kg)", "sum"), amt=("Total-Amount", "sum"),
                                 farmers=("Farmer-code", "nunique")).reset_index()
    mg["avg_price"] = (mg["amt"]/mg["qty"]).round(1)
    monthly = mg.sort_values("month").to_dict(orient="records")

    # ---- margin by season ----
    sm = bt.groupby("season").agg(qty=("b_qty", "sum"), margin=("margin", "sum")).reset_index()
    sm["margin_per_kg"] = (sm["margin"]/sm["qty"]).round(1)
    season_margin = sm.to_dict(orient="records")

    # ---- season comparison ----
    sg = t.groupby("Season").agg(qty=("Quantity-(Kg)", "sum"), amt=("Total-Amount", "sum"),
                                  farmers=("Farmer-code", "nunique"), txns=("Farmer-code", "count")).reset_index()
    sg["avg_price"] = (sg["amt"]/sg["qty"]).round(1)
    seasons = sg.rename(columns={"Season": "season"}).to_dict(orient="records")

    # ---- buyers ----
    bb = b.groupby("Buyer").agg(qty=("Quantity", "sum"), amt=("Total-Paid", "sum"),
                                 batches=("Harvest-batch-Id", "nunique")).reset_index()
    bb["avg_price"] = (bb["amt"]/bb["qty"]).round(1)
    buyers = bb.sort_values("qty", ascending=False).rename(columns={"Buyer": "buyer"}).to_dict(orient="records")

    # ---- districts ----
    dg = t.groupby("district").agg(qty=("Quantity-(Kg)", "sum"), amt=("Total-Amount", "sum"),
                                    farmers=("Farmer-code", "nunique")).reset_index()
    districts = dg.sort_values("qty", ascending=False).rename(columns={"district": "name"}).to_dict(orient="records")

    # ---- field officers ----
    og = t.groupby("Field-Officer").agg(qty=("Quantity-(Kg)", "sum"), amt=("Total-Amount", "sum"),
                                         farmers=("Farmer-code", "nunique"), txns=("Farmer-code", "count")).reset_index()
    og["avg_price"] = (og["amt"]/og["qty"]).round(1)
    og = og.sort_values("qty", ascending=False)
    og["Field-Officer"] = og["Field-Officer"].str.replace(r"\s*\(Ndugu\)", "", regex=True).str.title()
    officers = og.rename(columns={"Field-Officer": "name"}).to_dict(orient="records")

    # ---- top farmers ----
    fg = t.groupby(["Farmer-code", "Farmer-Name"]).agg(
        qty=("Quantity-(Kg)", "sum"), amt=("Total-Amount", "sum"), txns=("Farmer-code", "count")).reset_index()
    fg = fg.sort_values("qty", ascending=False).head(8).rename(columns={"Farmer-Name": "name"})
    top_farmers = fg[["name", "qty", "amt", "txns"]].to_dict(orient="records")

    # ---- distributions ----
    import numpy as np
    price = t["Price-Kg"]
    edges = [0, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 1e9]
    labs = ["<10k","10\u201311k","11\u201312k","12\u201313k","13\u201314k","14\u201315k","15\u201316k","16k+"]
    counts, _ = np.histogram(price, bins=edges)
    price_hist = [{"label": l, "count": int(c)} for l, c in zip(labs, counts)]

    qty = t["Quantity-(Kg)"]
    edges2 = [0, 150, 300, 450, 600, 900, 1e9]
    labs2 = ["<150","150\u2013300","300\u2013450","450\u2013600","600\u2013900","900+"]
    counts2, _ = np.histogram(qty, bins=edges2)
    qty_hist = [{"label": l, "count": int(c)} for l, c in zip(labs2, counts2)]

    fc = t.groupby("Farmer-code").size()
    bd = {"1 delivery": 0, "2": 0, "3": 0, "4\u20135": 0, "6\u20139": 0, "10+": 0}
    for v in fc:
        if v == 1: bd["1 delivery"] += 1
        elif v == 2: bd["2"] += 1
        elif v == 3: bd["3"] += 1
        elif v <= 5: bd["4\u20135"] += 1
        elif v <= 9: bd["6\u20139"] += 1
        else: bd["10+"] += 1
    farmer_freq = [{"label": k, "count": v} for k, v in bd.items()]

    # ---- gender / youth ----
    f["dob_parsed"] = f["DOB"].apply(parse_dob)
    ref = t["Transaction-Date"].max()
    f["age"] = (ref - f["dob_parsed"]).dt.days / 365.25
    f["gender_clean"] = f["Gender"].replace({"\\N": None})
    f["youth"] = f["age"] <= 35
    fm = f[["Farmer-Code", "gender_clean", "age", "youth"]].drop_duplicates(subset="Farmer-Code")
    merged = t.merge(fm, left_on="Farmer-code", right_on="Farmer-Code", how="left")

    def seg(r):
        grp = "Youth" if r["youth"] == True else "Adult"
        gen = r["gender_clean"] if pd.notna(r["gender_clean"]) else None
        return "Not recorded" if gen is None else f"{grp} {gen}"
    merged["seg"] = merged.apply(seg, axis=1)
    cx = merged.groupby("seg").agg(qty=("Quantity-(Kg)", "sum"), amt=("Total-Amount", "sum"),
                                    farmers=("Farmer-code", "nunique")).reset_index()
    cx["avg_price"] = (cx["amt"]/cx["qty"]).round(1)
    total_qty2 = cx["qty"].sum(); total_farmers2 = cx["farmers"].sum()
    cx["farmer_pct"] = (cx["farmers"]/total_farmers2*100).round(1)
    cx["qty_pct"] = (cx["qty"]/total_qty2*100).round(1)
    order = ["Adult Male","Adult Female","Youth Male","Youth Female","Not recorded"]
    cx = cx.set_index("seg").reindex(order).reset_index().fillna(0)
    segments = cx.to_dict(orient="records")

    active_unique = fm[fm["Farmer-Code"].isin(t["Farmer-code"])]
    women_pct = round((active_unique["gender_clean"] == "Female").sum()/len(active_unique)*100, 1)
    youth_pct = round((active_unique["youth"] == True).sum()/len(active_unique)*100, 1)

    # ---- map points ----
    f["lat_ok"] = f["Lat"].apply(is_num)
    f["long_ok"] = f["Long"].apply(is_num)
    both = f[f["lat_ok"] & f["long_ok"]].copy()
    both["lat"] = both["Lat"].astype(float)
    both["lon"] = both["Long"].astype(float)
    active_codes = set(t["Farmer-code"])
    both_active = both[both["Farmer-Code"].isin(active_codes)].copy()
    valid = both_active[(both_active["lat"].between(-1.6, 4.3)) & (both_active["lon"].between(29.3, 35.1))].copy()
    valid["didx"] = valid["District"].apply(lambda d: DISTRICTS_ORDER.index(d) if d in DISTRICTS_ORDER else len(DISTRICTS_ORDER))
    map_points = [[round(a, 4), round(b_, 4), int(c)] for a, b_, c in valid[["lat","lon","didx"]].values.tolist()]

    data = dict(
        kpis=kpis, monthly=monthly, season_margin=season_margin, seasons=seasons,
        buyers=buyers, districts=districts, officers=officers, top_farmers=top_farmers,
        price_hist=price_hist, qty_hist=qty_hist, farmer_freq=farmer_freq,
        segments=segments, women_pct=women_pct, youth_pct=youth_pct,
        map_points=map_points, map_districts=DISTRICTS_ORDER,
        generated_at=pd.Timestamp.now("UTC").strftime("%Y-%m-%d %H:%M UTC"),
    )

    with open(OUT_PATH, "w") as fo:
        json.dump(data, fo, separators=(",", ":"))
    print(f"Wrote {OUT_PATH} ({os.path.getsize(OUT_PATH):,} bytes)")

if __name__ == "__main__":
    main()
