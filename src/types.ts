/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScanResult {
  id: string;
  name: string;
  role: string;
  department: string;
  accessLevel: string;
  confidence: number;
  timestamp: string;
  faceSignature: string;
  avatarColor: string;
  avatarIconText: string;
}

export interface RegisteredPerson {
  name: string;
  role: string;
  department: string;
  accessLevel: string;
  faceSignature: string;
  avatarColor: string;
  avatarIconText: string;
}

export const REGISTERED_PERSONS: RegisteredPerson[] = [
  {
    name: "Sarah Jenkins",
    role: "Lead Systems Architect",
    department: "Core Infrastructure",
    accessLevel: "L5 Tier A",
    faceSignature: "F-SIG-908A",
    avatarColor: "from-cyan-500 to-blue-600",
    avatarIconText: "SJ"
  },
  {
    name: "Marcus Chen",
    role: "Senior Security Engineer",
    department: "Cyber Defense Group",
    accessLevel: "L4 Tier B",
    faceSignature: "F-SIG-112B",
    avatarColor: "from-indigo-500 to-purple-600",
    avatarIconText: "MC"
  },
  {
    name: "Elena Rostova",
    role: "Director of Neural Research",
    department: "Applied AI Sciences",
    accessLevel: "L5 Tier A",
    faceSignature: "F-SIG-776X",
    avatarColor: "from-fuchsia-500 to-pink-600",
    avatarIconText: "ER"
  },
  {
    name: "David Kalu",
    role: "UX Researcher",
    department: "Human-Interface Lab",
    accessLevel: "L2 Tier C",
    faceSignature: "F-SIG-404D",
    avatarColor: "from-emerald-400 to-teal-600",
    avatarIconText: "DK"
  },
  {
    name: "Aisha Al-Jamil",
    role: "Principal Product Officer",
    department: "Product Management Team",
    accessLevel: "L4 Tier A",
    faceSignature: "F-SIG-592P",
    avatarColor: "from-violet-500 to-indigo-600",
    avatarIconText: "AA"
  },
  {
    name: "Yuki Tanaka",
    role: "Chief DevOps Evangelist",
    department: "Global Deployment Ops",
    accessLevel: "L3 Tier B",
    faceSignature: "F-SIG-331Y",
    avatarColor: "from-yellow-400 to-orange-500",
    avatarIconText: "YT"
  },
  {
    name: "Carlos Mendez",
    role: "Hardware Security Specialist",
    department: "Cryptographic Hardware Dev",
    accessLevel: "L4 Tier A",
    faceSignature: "F-SIG-882C",
    avatarColor: "from-rose-500 to-red-600",
    avatarIconText: "CM"
  },
  {
    name: "Chloe Laurent",
    role: "Creative Brand Architect",
    department: "Immersive Design Studio",
    accessLevel: "L3 Tier C",
    faceSignature: "F-SIG-204F",
    avatarColor: "from-pink-400 to-rose-500",
    avatarIconText: "CL"
  },
  {
    name: "Liam O'Connor",
    role: "Lead Mobile Engine Compiler",
    department: "Core Mobile Systems",
    accessLevel: "L3 Tier B",
    faceSignature: "F-SIG-651M",
    avatarColor: "from-teal-400 to-cyan-600",
    avatarIconText: "LO"
  },
  {
    name: "Dr. Elizabeth Shaw",
    role: "VP of Cognitive Technologies",
    department: "Executive Board",
    accessLevel: "L5 Tier S",
    faceSignature: "F-SIG-001X",
    avatarColor: "from-blue-500 to-fuchsia-600",
    avatarIconText: "ES"
  }
];
