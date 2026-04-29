import requests
import time
from supabase import create_client

load_dotenv()
api_token = os.getenv("SUPABASE_URL")
api_token = os.getenv("SUPABASE_KEY")
api_token = os.getenv("APIFY_API_TOKEN")
ACTOR_ID = "M2FMdjRVeF1HPGfcc"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_mass_tracker():
    res = supabase.table("alumni") \
        .select("nama") \
        .eq("status_pelacakan", "Belum Dilacak") \
        .limit(5) \
        .execute()
    
    alumni_list = res.data

    if not alumni_list:
        print("✅ Semua alumni sudah diproses.")
        return

    print(f"🚀 Memulai pelacakan massal untuk {len(alumni_list)} alumni...")

    for alumni in alumni_list:
        nama = alumni['nama']
        print(f"🔍 Mengirim ke Apify: {nama}...")

        apify_url = f"https://api.apify.com/v2/acts/{ACTOR_ID}/runs?token={APIFY_TOKEN}"
        payload = {
            "search": f"{nama} Universitas Muhammadiyah Malang",
            "maxItems": 2 
        }

        try:
            response = requests.post(apify_url, json=payload)
            if response.status_code == 201:
                supabase.table("alumni") \
                    .update({"status_pelacakan": "Sedang Diproses (Apify)"}) \
                    .eq("nama", nama) \
                    .execute()
                print(f"✔️ Berhasil memicu antrean untuk {nama}")
            else:
                print(f"❌ Gagal: {response.text}")
        except Exception as e:
            print(f"⚠️ Error: {e}")

        time.sleep(5)

if __name__ == "__main__":
    run_mass_tracker()