export const calculateScore = (alumni, foundData) => {
  let score = 0;
  const weights = { name: 0.4, affiliation: 0.3, timeline: 0.2, study: 0.1 };

  // Cek Nama (Case Insensitive)
  if (foundData.name.toLowerCase().includes(alumni.nama.toLowerCase()))
    score += weights.name;

  // Cek Afiliasi Kampus (Sesuaikan dengan data riil alumni)
  const keywords = [
    "umm",
    "muhammadiyah",
    "malang",
    "informatics",
    "informatika",
  ];
  const hasKeyword = keywords.some((key) =>
    foundData.description.toLowerCase().includes(key),
  );
  if (hasKeyword) score += weights.affiliation;

  // Cek Tahun (Timeline)
  if (foundData.description.includes(alumni.tahun_lulus.toString()))
    score += weights.timeline;

  return parseFloat(score.toFixed(2));
};
