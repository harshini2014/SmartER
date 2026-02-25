export interface Hospital {
  id: string;
  name: string;
  distance: number; // km
  eta: number; // minutes
  beds: { icu: number; general: number };
  specialistAvailable: boolean;
  specialties: string[];
  equipment: string[];
  rating: number;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  smarterScore: number;
  scoreLevel: "green" | "yellow" | "red";
}

// Hospitals near Guntur / Vijayawada area (~16.457, 80.535)
export const mockHospitals: Hospital[] = [
  {
    id: "1",
    name: "NRI General Hospital",
    distance: 0.4,
    eta: 2,
    beds: { icu: 4, general: 12 },
    specialistAvailable: true,
    specialties: ["Cardiology", "Trauma", "Neurology"],
    equipment: ["Ventilator", "Cath Lab", "CT Scan", "MRI"],
    rating: 4.5,
    phone: "+91-9876543210",
    address: "Mangalagiri Road, Guntur",
    lat: 16.4605,
    lng: 80.5380,
    smarterScore: 92,
    scoreLevel: "green",
  },
  {
    id: "2",
    name: "Kamineni Hospital",
    distance: 0.7,
    eta: 3,
    beds: { icu: 2, general: 8 },
    specialistAvailable: true,
    specialties: ["Cardiology", "Orthopedics"],
    equipment: ["Ventilator", "Cath Lab", "X-Ray"],
    rating: 4.2,
    phone: "+91-9876543211",
    address: "AT Agraharam, Guntur",
    lat: 16.4540,
    lng: 80.5310,
    smarterScore: 78,
    scoreLevel: "yellow",
  },
  {
    id: "3",
    name: "Sankar Foundation Eye Hospital",
    distance: 0.9,
    eta: 4,
    beds: { icu: 0, general: 3 },
    specialistAvailable: false,
    specialties: ["General Medicine", "Ophthalmology"],
    equipment: ["X-Ray", "ECG"],
    rating: 3.8,
    phone: "+91-9876543212",
    address: "Lakshmipuram, Guntur",
    lat: 16.4620,
    lng: 80.5420,
    smarterScore: 45,
    scoreLevel: "red",
  },
  {
    id: "4",
    name: "Government General Hospital",
    distance: 0.5,
    eta: 2,
    beds: { icu: 3, general: 15 },
    specialistAvailable: true,
    specialties: ["Trauma", "Neurology", "Cardiology"],
    equipment: ["Ventilator", "CT Scan", "Trauma Care"],
    rating: 4.7,
    phone: "+91-9876543213",
    address: "Kanna Vari Thota, Guntur",
    lat: 16.4555,
    lng: 80.5395,
    smarterScore: 86,
    scoreLevel: "green",
  },
  {
    id: "5",
    name: "Life Line Super Specialty",
    distance: 0.3,
    eta: 1,
    beds: { icu: 1, general: 6 },
    specialistAvailable: false,
    specialties: ["General Medicine", "First Aid"],
    equipment: ["ECG", "Basic Life Support"],
    rating: 3.5,
    phone: "+91-9876543214",
    address: "Brodipet, Guntur",
    lat: 16.4585,
    lng: 80.5365,
    smarterScore: 58,
    scoreLevel: "yellow",
  },
];
