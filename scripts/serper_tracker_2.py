import os  # Tambahkan baris ini
import http.client
import json
from dotenv import load_dotenv

# Load environment variables dari file .env
load_dotenv()
import http.client
import json
import time
from supabase import create_client

SERPER_API_KEY_2 = os.getenv("SERPER_API_KEY_2")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def search_serper(query):
    conn = http.client.HTTPSConnection("google.serper.dev")
    payload = json.dumps({"q": query})
    headers = {
        'X-API-KEY': SERPER_API_KEY_2,
        'Content-Type': 'application/json'
    }
    conn.request("POST", "/search", payload, headers)
    res = conn.getresponse()
    return json.loads(res.read().decode("utf-8"))

def generate_queries(nama, prodi):
    """Menghasilkan variasi query untuk meningkatkan akurasi"""
    queries = []
    # 1. Nama Lengkap + Kampus (Akurat)
    queries.append(f'site:linkedin.com/in "{nama}" "Universitas Muhammadiyah Malang"')
    
    # 2. Inisial Nama + UMM (Singkatan)
    parts = nama.split()
    if len(parts) > 1:
        inisial = f"{parts[0]} {parts[-1][0]}." # Misal: Muhammad Rizky -> Muhammad R.
        queries.append(f'site:linkedin.com/in "{inisial}" UMM {prodi or ""}')
        
    # 3. Nama + Prodi + Kota (Konteks)
    queries.append(f'site:linkedin.com/in {nama} {prodi or ""} Malang')
    
    return queries

def run_serper_tracker(limit=100):
    print(f"--- SERPER DEEP SEARCH: PROCESSING {limit} ALUMNI ---")
    
    res = supabase.table("alumni").select("id, nama, prodi")\
        .eq("status_pelacakan", "Belum Dilacak")\
        .lte("id", 71146)\
        .limit(limit).execute()
    alumni_list = res.data

    for alumni in alumni_list:
        variasi_queries = generate_queries(alumni['nama'], alumni.get('prodi'))
        found_data = None

        print(f"\nMenganalisa: {alumni['nama']}")
        
        for i, q in enumerate(variasi_queries):
            try:
                print(f"  [Lapis {i+1}] Mencari...", end="\r")
                results = search_serper(q)
                
                if "organic" in results and len(results["organic"]) > 0:
                    top = results["organic"][0]
                    found_data = {
                        "linkedin_url": top.get("link"),
                        "posisi": top.get("title").split("-")[0].strip() if "-" in top.get("title") else top.get("title"),
                        "snippet": top.get("snippet", "")
                    }
                    break # Berhenti jika sudah ketemu di lapis ini
                
                time.sleep(0.2) # Jeda antar lapis
            except:
                continue

        if found_data:
            # Update ke Supabase
            supabase.table("alumni").update({
                "linkedin_url": found_data["linkedin_url"],
                "posisi": found_data["posisi"],
                "status_pelacakan": "Teridentifikasi (Serper Deep)"
            }).eq("id", alumni['id']).execute()
            print(f"  [+] BERHASIL ditemukan via Lapis {i+1}")
        else:
            # Tandai agar tidak membuang kuota di masa depan
            supabase.table("alumni").update({"status_pelacakan": "Pending (Deep Search)"}).eq("id", alumni['id']).execute()
            print(f"  [-] Tidak ditemukan di semua variasi.")

if __name__ == "__main__":
    # Langsung set ke 2500 sesuai kuota gratis Serper
    # Kita bagi per batch kecil di dalam loop secara otomatis agar aman
    run_serper_tracker(limit=530)