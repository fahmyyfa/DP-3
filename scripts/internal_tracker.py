import time
import re
import requests
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

SERPAPI_KEY = "a17805529bd998f4ac930731690b063089bf5be46728c5c0326823d2aab6a661"

PLATFORMS = {
    "linkedin_url": "site:linkedin.com/in",
    "instagram_url": "site:instagram.com",
    "facebook_url": "site:facebook.com"
}

def extract_public_data(snippet, current_data):
    """Ekstraksi Data Kompleks (Tidak Berubah)"""
    snippet_str = str(snippet)
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    PHONE_PATTERN = r'(?:\+62|08)[0-9]{7,11}'
    
    if "email" not in current_data:
        emails = re.findall(EMAIL_PATTERN, snippet_str)
        if emails: current_data["email"] = emails[0]
            
    if "no_hp" not in current_data:
        phones = re.findall(PHONE_PATTERN, snippet_str.replace(" ", "").replace("-", ""))
        if phones: current_data["no_hp"] = phones[0]

    HANDLE_PATTERN = r'(?:^|\s)(@[a-zA-Z0-9_.]+)(?!\w*@)'
    if "sosmed_kantor" not in current_data:
        handles = re.findall(HANDLE_PATTERN, snippet_str)
        for handle in handles:
            if "email" not in current_data or handle not in current_data.get("email", ""):
                current_data["sosmed_kantor"] = handle.strip()
                break

    if "posisi" not in current_data and " at " in snippet_str:
        parts = snippet_str.split(" at ")
        if len(parts) > 1:
            current_data["posisi"] = parts[0].split()[-1]
            tempat_kotor = parts[1]
            for separator in [' - ', ' | ', '.', ',']:
                tempat_kotor = tempat_kotor.split(separator)[0]
            current_data["tempat_kerja"] = tempat_kotor.strip()

    if "jenis_instansi" not in current_data:
        pos_lower = current_data.get("posisi", "").lower()
        tk_lower = current_data.get("tempat_kerja", snippet_str).lower()
        kunci_wirausaha = ['owner', 'founder', 'ceo', 'self employed', 'wiraswasta', 'freelance', 'pemilik']
        if any(kw in pos_lower for kw in kunci_wirausaha):
            current_data["jenis_instansi"] = "Wirausaha"
        elif any(kw in tk_lower for kw in ['dinas', 'kementerian', 'pemprov', 'pemkab', 'pemkot', 'negeri', 'sdn ', 'smpn ', 'sman ', 'puskesmas', 'rsud', 'badan']):
            current_data["jenis_instansi"] = "PNS"
        elif current_data.get("tempat_kerja"):
            current_data["jenis_instansi"] = "Swasta"

    if "alamat_kerja" not in current_data:
        kota_populer = ['Jakarta', 'Surabaya', 'Malang', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Yogyakarta', 'Bali', 'Sidoarjo', 'Batu', 'Gresik']
        for kota in kota_populer:
            if kota.lower() in snippet_str.lower():
                current_data["alamat_kerja"] = kota
                break 
    return current_data

def generate_smart_queries(name, prodi, platform_dork):
    """Pencarian 3 Lapis"""
    queries = []
    queries.append(f'{platform_dork} "{name}" "Universitas Muhammadiyah Malang"') # Formal
    parts = name.split()
    if len(parts) > 1:
        queries.append(f'{platform_dork} {parts[0]} {parts[-1][0]}. UMM Malang') # Singkatan
    if prodi:
        prodi_bersih = str(prodi).replace("S1", "").replace("S-1", "").replace("Teknik", "").strip()
        queries.append(f'{platform_dork} {name} {prodi_bersih} UMM') # Konteks
    return queries

def search_with_serpapi(query):
    """Fungsi khusus untuk menembak SerpApi (Anti-Blokir)"""
    url = f"https://serpapi.com/search.json?engine=google&q={query}&api_key={SERPAPI_KEY}"
    try:
        response = requests.get(url).json()
        if "organic_results" in response and len(response["organic_results"]) > 0:
            # Mengembalikan Link dan Snippet dari hasil teratas
            first_result = response["organic_results"][0]
            return first_result.get("link"), first_result.get("snippet", "")
        return None, None
    except Exception as e:
        print(f"    [!] Error SerpApi: {e}")
        return None, None

def run_serpapi_tracker(limit=30):
    print(f"--- Memulai Pelacakan Level Industri (SerpApi) untuk {limit} data ---")
    
    # Ambil data yang sebelumnya gagal atau belum dilacak
    response = supabase.table("alumni").select("id, nama, prodi").in_("status_pelacakan", ["Belum Dilacak", "Gagal Internal - Butuh SerpApi"]).limit(limit).execute()
    alumni_list = response.data

    if not alumni_list:
        print("Semua data sudah dilacak (atau kuota halaman ini habis).")
        return

    for alumni in alumni_list:
        print(f"\nMenganalisa Target: {alumni['nama']}")
        updated_data = {}

        # Karena SerpApi berbayar/dibatasi (100 pencarian), KITA FOKUS DI LINKEDIN SAJA DULU untuk menghemat kuota
        # Jika Anda ingin mencari IG/FB juga, ubah 'PLATFORMS' di atas
        for column, dork in {"linkedin_url": "site:linkedin.com/in"}.items(): 
            variasi_queries = generate_smart_queries(alumni["nama"], alumni.get("prodi"), dork)
            
            for attempt, query in enumerate(variasi_queries):
                # Eksekusi pencarian ke SerpApi
                found_url, snippet = search_with_serpapi(query)
                
                if found_url:
                    updated_data[column] = found_url
                    print(f"  [+] URL {column.split('_')[0]} ditemukan (Lapis {attempt+1}) via SerpApi")
                    updated_data = extract_public_data(snippet, updated_data)
                    break 
                    
            if updated_data:
                updated_data["status_pelacakan"] = "Teridentifikasi (SerpApi)"
                supabase.table("alumni").update(updated_data).eq("id", alumni['id']).execute()
                
                extracted_keys = [k for k in updated_data.keys() if k not in ["status_pelacakan", "linkedin_url"]]
                if extracted_keys:
                    print(f"  [!] Berhasil mengekstrak data publik: {', '.join(extracted_keys)}")
            else:
                supabase.table("alumni").update({"status_pelacakan": "Gagal SerpApi (Data Kosong)"}).eq("id", alumni['id']).execute()
                print(f"  [-] Target memang tidak memiliki jejak digital publik.")

        print(f"  [~] Menunggu 2 detik sebelum target berikutnya...")
        time.sleep(2)

if __name__ == "__main__":
    total_target = 218 
    
    print(f"Memulai Batch Tracking: {total_target} data...")
    
    run_serpapi_tracker(limit=total_target)