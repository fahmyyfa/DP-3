import time
from duckduckgo_search import DDGS
from supabase import create_client

# --- KONFIGURASI SUPABASE ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_mass_indexing(limit=500):
    print(f"--- OPERASI PENYELAMATAN NILAI (COVERAGE): TARGET {limit} DATA ---")
    
    res = supabase.table("alumni").select("id, nama").eq("status_pelacakan", "Belum Dilacak").limit(limit).execute()
    alumni_list = res.data

    if not alumni_list:
        print("Semua data sudah terisi.")
        return

    with DDGS() as ddgs:
        for i, alumni in enumerate(alumni_list):
            nama = alumni['nama']
            
            # STRATEGI 2 LAPIS
            queries = [
                f'site:linkedin.com/in "{nama}" UMM', # Lapis 1: Akurat
                f'linkedin.com {nama} Universitas Muhammadiyah Malang' # Lapis 2: Longgar
            ]
            
            found_url = None
            for query in queries:
                try:
                    results = list(ddgs.text(query, max_results=1))
                    if results:
                        found_url = results[0]['href']
                        break # Berhenti jika sudah ketemu
                    time.sleep(0.5) # Jeda antar query
                except:
                    continue

            if found_url:
                supabase.table("alumni").update({
                    "linkedin_url": found_url,
                    "status_pelacakan": "Terindeks (Mass Scraper)"
                }).eq("id", alumni['id']).execute()
                print(f"[{i+1}/{limit}] BERHASIL: {nama}")
            else:
                # JANGAN beri status GAGAL dulu agar bisa dicoba lagi nanti
                # Kita beri status 'Pending' agar tidak muncul di list 'Belum Dilacak' sementara
                supabase.table("alumni").update({
                    "status_pelacakan": "Pending (Mass)"
                }).eq("id", alumni['id']).execute()
                print(f"[{i+1}/{limit}] KOSONG: {nama}")
            
            time.sleep(1) # Jeda antar alumni agar aman

if __name__ == "__main__":
    # Jalankan 500 data per running. Jika aman, naikkan ke 1000.
    run_mass_indexing(limit=500)