from googlesearch import search

# Target Uji Coba
nama_target = "Fahmi Alfaqih"
kampus = "Universitas Muhammadiyah Malang"

# Query yang lebih natural untuk Google (Tanpa site: yang kaku)
query = f"{nama_target} LinkedIn {kampus}"

print(f"Mencari data untuk: {nama_target}...")
print(f"Query Google: {query}\n")

try:
    # Meminta 3 hasil teratas dari Google
    hasil = search(query, num_results=3, lang="id")
    
    ditemukan = False
    for i, url in enumerate(hasil):
        print(f"Hasil {i+1}: {url}")
        ditemukan = True
        
    if not ditemukan:
        print("\n[-] Google tidak menemukan apa-apa. Artinya data orang ini memang tidak ada di internet.")

except Exception as e:
    print(f"\n[!] Error / Terblokir Google: {e}")