export const AUDIT_FIELDS = [
  "linkedin_url",
  "instagram_url",
  "facebook_url",
  "tiktok_url",
  "email",
  "no_hp",
  "tempat_kerja",
  "alamat_kerja",
  "posisi",
  "jenis_instansi",
  "sosmed_kantor",
];

const WEIGHT_PER_FIELD = 100 / AUDIT_FIELDS.length;

export const calculateAutoScore = (alumni) => {
  if (!alumni) return 0;
  const filledFields = AUDIT_FIELDS.filter(
    (field) => alumni[field] && alumni[field].toString().trim() !== "",
  ).length;

  return Math.round(filledFields * WEIGHT_PER_FIELD);
};

export const calculateManualScore = (matchStates) => {
  const matchCount = Object.values(matchStates).filter(
    (status) => status === "MATCH",
  ).length;

  return Math.round(matchCount * WEIGHT_PER_FIELD);
};
