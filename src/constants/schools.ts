export type SchoolConfig = {
  key: string;
  name: string;
  domain: string;
  welcomeLabel: string;
  halls: string[];
};

export const SCHOOL_CONFIGS: SchoolConfig[] = [
  {
    key: 'lewis_and_clark',
    name: 'Lewis & Clark College',
    domain: 'lclark.edu',
    welcomeLabel: "Lewis & Clark's",
    halls: [
      'Copeland Hall',
      'Akin Hall',
      'Forest Hall',
      'Odell Hall',
      'Stewart Hall',
      'Holmes Hall',
      'Hartzfeld Hall',
      'Apartments',
      'Off-campus',
    ],
  },
  {
    key: 'portland_state',
    name: 'Portland State University',
    domain: 'pdx.edu',
    welcomeLabel: "Portland State's",
    halls: [
      'Broadway',
      'Ondine',
      'Blumel',
      'Epler',
      'University Pointe',
      'Off-campus',
    ],
  },
];

export const DEFAULT_HALLS = ['On campus', 'Off-campus', 'Other'];

export function getSchoolFromEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  return SCHOOL_CONFIGS.find((school) => domain.endsWith(school.domain)) ?? null;
}
