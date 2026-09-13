export interface TeamMember {
  name: string
  deptCode: 'T' | 'E' | 'R' | 'S' | 'D' | 'P' | 'R / S' | 'P / D'
  department: string
}

export interface TeamConfig {
  number: string // '01', '02', '03', '04', '05'
  name: string
  id: string
  slug: string
  logo: string
  leaders: string
  memberCount: number
  track: string
  members: TeamMember[]
}

export const DEPARTMENT_KEY: Record<string, { code: string; label: string }> = {
  T: { code: 'T', label: 'Technical' },
  E: { code: 'E', label: 'Event Mgt' },
  R: { code: 'R', label: 'R&D' },
  S: { code: 'S', label: 'Social' },
  D: { code: 'D', label: 'Design' },
  P: { code: 'P', label: 'PR' },
}

export const SPRINT_INFO = {
  title: "Tech Sprint Journey",
  code: "TSJ / 2026",
  year: "2026",
  motto: "Quality Over Quantity",
  organization: "AARVAK",
  orgTagline: "The One Who Innovates",
  durationText: "75 DAYS — 05 TEAMS — 01 JOURNEY",
  totalDays: 75,
  introHeading: "Five teams. Different strengths. One shared tech journey.",
  introQuote: "Technology is not just about the final product, it is about asking better questions, trying things that may fail, helping each other, and getting a little better with every iteration.",
  closingQuote: "Here's to the journey ahead. Learn boldly, build together, and make every experiment count."
}

export const TEAMS: TeamConfig[] = [
  {
    number: "01",
    name: "ASCEND",
    id: "8f7af888-7dca-467c-86a0-f4500bc1c0ed",
    slug: "ascend",
    logo: "/teams/ascend.jpg",
    leaders: "Sarthak Aneja & Sunny",
    memberCount: 9,
    track: "Ascend Track",
    members: [
      { name: "Yogay Jain", deptCode: "T", department: "Technical" },
      { name: "Pushkar Sharma", deptCode: "T", department: "Technical" },
      { name: "Pashin Pruhi", deptCode: "T", department: "Technical" },
      { name: "Parth", deptCode: "R", department: "R&D" },
      { name: "Kanishka Sharma", deptCode: "R", department: "R&D" },
      { name: "Rishika Jain", deptCode: "P", department: "PR" },
      { name: "Parv Goyal", deptCode: "D", department: "Design" },
      { name: "Bhavya Aneja", deptCode: "S", department: "Social" },
      { name: "Harsh Vashist", deptCode: "E", department: "Event Mgt" },
    ]
  },
  {
    number: "02",
    name: "CIPHER",
    id: "6f1d2404-636c-4b6b-b19d-40dae4018c92",
    slug: "cipher",
    logo: "/teams/cipher.png",
    leaders: "Vibhoor Jain & Harsh Gupta",
    memberCount: 8,
    track: "Cipher Track",
    members: [
      { name: "Kartik Sharma", deptCode: "T", department: "Technical" },
      { name: "Apurva", deptCode: "T", department: "Technical" },
      { name: "Anushka Arora", deptCode: "P", department: "PR" },
      { name: "Ridhi Jaiswal", deptCode: "D", department: "Design" },
      { name: "Ebnay Razi", deptCode: "E", department: "Event Mgt" },
      { name: "Manthan Bhatia", deptCode: "P", department: "PR" },
      { name: "Tanvi", deptCode: "S", department: "Social" },
      { name: "Tavishi Jain", deptCode: "R", department: "R&D" },
    ]
  },
  {
    number: "03",
    name: "NEXUS",
    id: "54a0575b-8f20-4882-9d4f-391c94ffd560",
    slug: "nexus",
    logo: "/teams/nexus.jpg",
    leaders: "Rohit & Keshav",
    memberCount: 8,
    track: "Nexus Track",
    members: [
      { name: "Kartik Arora", deptCode: "T", department: "Technical" },
      { name: "Mayank Kumar", deptCode: "T", department: "Technical" },
      { name: "Shourya Thakur", deptCode: "R", department: "R&D" },
      { name: "Pranay Ahuja", deptCode: "P", department: "PR" },
      { name: "Ranvijay Sharma", deptCode: "D", department: "Design" },
      { name: "Sarthak Gupta", deptCode: "P", department: "PR" },
      { name: "Raghav Sharma", deptCode: "S", department: "Social" },
      { name: "Kritika Madan", deptCode: "E", department: "Event Mgt" },
    ]
  },
  {
    number: "04",
    name: "BYTE BRIGADE",
    id: "f876de5d-4ada-4e24-bc97-bba3408d82f2",
    slug: "byte-brigade",
    logo: "/teams/byte-brigade.jpg",
    leaders: "Devansh Sachdeva & Mrigank Rana",
    memberCount: 9,
    track: "Byte Brigade Track",
    members: [
      { name: "Ayush Choudhary", deptCode: "R / S", department: "R&D / Social" },
      { name: "Yuv Jindal", deptCode: "T", department: "Technical" },
      { name: "Oishik Guha", deptCode: "R", department: "R&D" },
      { name: "Tejas Goel", deptCode: "E", department: "Event Mgt" },
      { name: "Nakkul Gulati", deptCode: "T", department: "Technical" },
      { name: "Aditya Sasmal", deptCode: "S", department: "Social" },
      { name: "Aditya Balodi", deptCode: "E", department: "Event Mgt" },
      { name: "Devansh Dua", deptCode: "P", department: "PR" },
      { name: "Simran", deptCode: "D", department: "Design" },
    ]
  },
  {
    number: "05",
    name: "ECHO",
    id: "f0ab9a4a-2e4b-4568-99ef-5b4736cc33c5",
    slug: "echo",
    logo: "/teams/echo.png",
    leaders: "Ishita & Harshil",
    memberCount: 9,
    track: "Echo Track",
    members: [
      { name: "Adhyan Mehra", deptCode: "S", department: "Social" },
      { name: "Akshansh Bansal", deptCode: "E", department: "Event Mgt" },
      { name: "Naman Goel", deptCode: "T", department: "Technical" },
      { name: "Sanidhya Shishodia", deptCode: "T", department: "Technical" },
      { name: "Bhuvi Miglani", deptCode: "R", department: "R&D" },
      { name: "Ayush Verma", deptCode: "P / D", department: "PR / Design" },
      { name: "Sagar Sukhija", deptCode: "S", department: "Social" },
      { name: "Aditya Aarsh", deptCode: "T", department: "Technical" },
      { name: "Ayush Adhikari", deptCode: "P", department: "PR" },
    ]
  },
]

export function getTeamConfig(teamNameOrId: string): TeamConfig | undefined {
  if (!teamNameOrId) return undefined
  const query = teamNameOrId.trim().toLowerCase()
  return TEAMS.find(t => 
    t.name.toLowerCase() === query || 
    t.id.toLowerCase() === query ||
    t.slug.toLowerCase() === query ||
    t.number === query
  )
}

export function getTeamLogo(teamNameOrId: string): string {
  const team = getTeamConfig(teamNameOrId)
  return team?.logo || "/teams/ascend.jpg"
}
