export interface District {
  value: string;
  label: string;
}

export interface Province {
  value: string;
  label: string;
  districts: District[];
}

// Basic Rwanda-style structure; can be extended as needed.
export const PROVINCES: Province[] = [
  {
    value: "kigali",
    label: "Kigali City",
    districts: [
      { value: "gasabo", label: "Gasabo" },
      { value: "kicukiro", label: "Kicukiro" },
      { value: "nyarugenge", label: "Nyarugenge" },
    ],
  },
  {
    value: "northern",
    label: "Northern Province",
    districts: [
      { value: "burera", label: "Burera" },
      { value: "gakenke", label: "Gakenke" },
      { value: "gicumbi", label: "Gicumbi" },
      { value: "musanze", label: "Musanze" },
      { value: "rulindo", label: "Rulindo" },
    ],
  },
  {
    value: "southern",
    label: "Southern Province",
    districts: [
      { value: "gisagara", label: "Gisagara" },
      { value: "huye", label: "Huye" },
      { value: "kamonyi", label: "Kamonyi" },
      { value: "muhoza", label: "Muhanga" },
      { value: "nyamagabe", label: "Nyamagabe" },
      { value: "nyanza", label: "Nyanza" },
      { value: "nuri", label: "Nyaruguru" },
      { value: "ruhango", label: "Ruhango" },
    ],
  },
  {
    value: "eastern",
    label: "Eastern Province",
    districts: [
      { value: "bugesera", label: "Bugesera" },
      { value: "gatsibo", label: "Gatsibo" },
      { value: "kayonza", label: "Kayonza" },
      { value: "kirehe", label: "Kirehe" },
      { value: "ngoma", label: "Ngoma" },
      { value: "nyagatare", label: "Nyagatare" },
      { value: "rwamagana", label: "Rwamagana" },
    ],
  },
  {
    value: "western",
    label: "Western Province",
    districts: [
      { value: "karongi", label: "Karongi" },
      { value: "ngororero", label: "Ngororero" },
      { value: "nyabihu", label: "Nyabihu" },
      { value: "nyamasheke", label: "Nyamasheke" },
      { value: "rubavu", label: "Rubavu" },
      { value: "rusizi", label: "Rusizi" },
      { value: "rutsiro", label: "Rutsiro" },
    ],
  },
];

export function getDistrictsForProvince(provinceValue: string | null | undefined): District[] {
  if (!provinceValue) return [];
  const province = PROVINCES.find((p) => p.value === provinceValue);
  return province?.districts ?? [];
}

