import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def calculate_auto_score(row):
    score = 0
    name = str(row.get('nama', '')).lower()
    prodi = str(row.get('prodi', '')).lower()
    
    if row.get('linkedin_url'):
        score += 20
        clean_name = name.replace(" ", "")
        if clean_name in str(row['linkedin_url']).lower():
            score += 20

    if row.get('tempat_kerja') and row.get('posisi'):
        score += 30

    if row.get('email'): score += 10
    if row.get('no_hp'): score += 10

    if row.get('instagram_url') or row.get('facebook_url'):
        score += 10

    return score

def run_validator():
    res = supabase.table("alumni").select("*").not_.eq("status_pelacakan", "Belum Dilacak").execute()
    alumni_list = res.data
    print(f"Total data yang akan diaudit: {len(alumni_list)}")

    print(f"Mengaudit {len(alumni_list)} data...")

    for alumni in alumni_list:
        score = calculate_auto_score(alumni)
        supabase.table("alumni").update({"auto_score": score}).eq("id", alumni['id']).execute()
        print(f"ID {alumni['id']} - {alumni['nama']}: Auto Score {score}%")

if __name__ == "__main__":
    run_validator()