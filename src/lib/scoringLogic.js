export const calculateScore = (alumni, foundData) => {
  let score = 0;

  // Bobot sesuai DP-2 Anda [cite: 120, 220]
  const weights = { name: 0.4, affiliation: 0.3, timeline: 0.2, study: 0.1 };

  // 1. Cek Nama (Sederhana)
  if (foundData.name.toLowerCase().includes(alumni.nama.toLowerCase())) {
    score += weights.name;
  }

  // 2. Cek Afiliasi/Kampus [cite: 243, 249]
  if (
    foundData.description.toLowerCase().includes("umm") ||
    foundData.description.toLowerCase().includes("muhammadiyah")
  ) {
    score += weights.affiliation;
  }

  // 3. Cek Timeline (Tahun Lulus) [cite: 243, 249]
  if (foundData.description.includes(alumni.tahun_lulus.toString())) {
    score += weights.timeline;
  }

  return parseFloat(score.toFixed(2));
};
