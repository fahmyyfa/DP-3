import os
import time
import re
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Konfigurasi
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 4 Media Sosial Utama
PLATFORMS = {
    "linkedin_url": "site:linkedin.com/in",
    "instagram_url": "site:instagram.com",
    "facebook_url": "site:facebook.com",
    "tiktok_url": "site:tiktok.com"
}

def extract_alumni_data(snippet, current_data):
    """Ekstraksi 11 Poin Data (Natural & Classified)"""
    s = str(snippet)
    
    # 1. Kontak (Email & No HP)
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', s)
    if emails and not current_data.get("email"): current_data["email"] = emails[0]
    
    phones = re.findall(r'(?:\+62|08)[0-9]{7,11}', s.replace(" ", "").replace("-", ""))
    if phones and not current_data.get("no_hp"): current_data["no_hp"] = phones[0]

    # 2. Karir (Posisi, Tempat Kerja, Alamat Kerja)
    if " - " in s:
        parts = s.split(" - ")
        if len(parts) > 1:
            career_info = parts[1]
            if " at " in career_info:
                p_split = career_info.split(" at ", 1)
                if not current_data.get("posisi"): current_data["posisi"] = p_split[0].strip()
                if not current_data.get("tempat_kerja"): current_data["tempat_kerja"] = p_split[1].strip()
            else:
                if not current_data.get("posisi"): current_data["posisi"] = career_info.strip()

            if len(parts) > 2 and not current_data.get("alamat_kerja"):
                current_data["alamat_kerja"] = parts[2].split('|')[0].strip()

    # 3. Klasifikasi Instansi
    job_context = f"{current_data.get('posisi', '')} {current_data.get('tempat_kerja', '')}".lower()
    if any(x in job_context for x in ['owner', 'founder', 'ceo', 'wiraswasta', 'usaha', 'pemilik']):
        current_data["jenis_instansi"] = "Wirausaha"
    elif any(x in job_context for x in ['dinas', 'kementerian', 'pns', 'asn', 'negeri', 'upt', 'guru']):
        current_data["jenis_instansi"] = "PNS"
    elif current_data.get("tempat_kerja"):
        current_data["jenis_instansi"] = "Swasta"

    # 4. Sosmed Kantor (@handle)
    handle = re.search(r'@([a-z0-9_.]+)', s)
    if handle and not current_data.get("sosmed_kantor"):
        current_data["sosmed_kantor"] = f"@{handle.group(1)}"

    return current_data

def search_serpapi(query):
    url = f"https://serpapi.com/search.json?engine=google&q={query}&api_key={SERPAPI_KEY}"
    try:
        res = requests.get(url).json()
        if "organic_results" in res and len(res["organic_results"]) > 0:
            return res["organic_results"][0].get("link"), res["organic_results"][0].get("snippet", "")
    except: pass
    return None, None

def run_exhaustive_tracker(limit=60):
    print(f"--- Menjalankan Pelacakan 11 Atribut & 4 Platform ---")
    res = supabase.table("alumni").select("id, nama, prodi").eq("status_pelacakan", "Belum Dilacak").limit(limit).execute()
    alumni_list = res.data

    for alumni in alumni_list:
        print(f"\nTarget: {alumni['nama']}")
        # Inisialisasi dictionary data untuk alumni saat ini
        data = {}

        for col, dork in PLATFORMS.items():
            query = f'{dork} "{alumni["nama"]}" UMM'
            print(f"  [-] Mencari {col.split('_')[0]}...", end="\r")
            
            link, snip = search_serpapi(query)
            if link:
                data[col] = link
                data = extract_alumni_data(snip, data)
                print(f"  [+] Data ditemukan di {col.split('_')[0]}           ")
            
            time.sleep(0.5)

        if data:
            # --- LOGIKA REVISI: Hitung found_count sebelum update ---
            # Menghitung semua key yang memiliki nilai (LinkedIn, IG, Posisi, dll)
            found_count = len([k for k, v in data.items() if v])
            
            data["found_count"] = found_count
            data["status_pelacakan"] = "Teridentifikasi (Full Natural)"
            
            supabase.table("alumni").update(data).eq("id", alumni['id']).execute()
            print(f" [!] Sinkronisasi Berhasil: {found_count} atribut ditemukan.")
        else:
            supabase.table("alumni").update({"status_pelacakan": "Gagal Pelacakan"}).eq("id", alumni['id']).execute()
            print(f" [x] Tidak ada data ditemukan.")

if __name__ == "__main__":
    # Kuota 250 token SerpApi / 4 query per alumni = ~62 alumni
    run_exhaustive_tracker(limit=60)