export const mockCases = [
  {
    id: "1",
    user_id: "u1",
    reason: "Over-speeding",
    location: "Raipur Central",
    latitude: 21.2514,
    longitude: 81.6296,
    severity: "high", // red
    timestamp: 1777699229,
    user_name: "Amit Kumar",
    vehicle_number: "CG04AB1234",
    fine: 1500,
    status: "Pending"
  },
  {
    id: "2",
    user_id: "u2",
    reason: "Signal Jump",
    location: "Bhilai Sector 6",
    latitude: 21.1938,
    longitude: 81.3509,
    severity: "medium", // yellow
    timestamp: 1777699782,
    user_name: "Rahul Singh",
    vehicle_number: "CG07XY5678",
    fine: 1000,
    status: "Paid"
  },
  {
    id: "3",
    user_id: "u3",
    reason: "No Helmet",
    location: "Bilaspur Chowk",
    latitude: 22.0797,
    longitude: 82.1409,
    severity: "low", // green
    timestamp: 1777700841,
    user_name: "Suresh",
    vehicle_number: "CG10CD9876",
    fine: 500,
    status: "Pending"
  },
  {
    id: "4",
    user_id: "u4",
    reason: "Drunk Driving",
    location: "Raipur Highway",
    latitude: 21.3000,
    longitude: 81.6500,
    severity: "high",
    timestamp: 1777701873,
    user_name: "Vikram",
    vehicle_number: "CG04EF4321",
    fine: 10000,
    status: "Pending"
  },
  {
    id: "5",
    user_id: "u5",
    reason: "Wrong Way",
    location: "Durg Bypass",
    latitude: 21.1900,
    longitude: 81.2800,
    severity: "medium",
    timestamp: 1777702132,
    user_name: "Deepak",
    vehicle_number: "CG07GH5555",
    fine: 2000,
    status: "Paid"
  }
];

export const weeklyChallansData = [
  { day: "Mon", cases: 120, revenue: 1.2 },
  { day: "Tue", cases: 200, revenue: 2.1 },
  { day: "Wed", cases: 150, revenue: 1.5 },
  { day: "Thu", cases: 290, revenue: 3.0 },
  { day: "Fri", cases: 250, revenue: 2.6 },
  { day: "Sat", cases: 340, revenue: 3.5 },
  { day: "Sun", cases: 210, revenue: 2.2 },
];

export const violationDistributionData = [
  { name: "Signal Jump", value: 35, color: "#3b82f6" },
  { name: "No Helmet", value: 25, color: "#f97316" },
  { name: "Speeding", value: 20, color: "#ef4444" },
  { name: "Wrong Parking", value: 12, color: "#14b8a6" },
  { name: "Others", value: 8, color: "#a855f7" },
];

export const recentActivity = [
  { id: 1, officer: "Amit K.", action: "Issued Challan", details: "Over-speeding at Raipur Central", time: "2 min ago", type: "challan" },
  { id: 2, officer: "Rahul S.", action: "Query", details: "Checked section for tinted glass", time: "5 min ago", type: "query" },
  { id: 3, officer: "Suresh P.", action: "Payment Collected", details: "₹500 for No Helmet", time: "12 min ago", type: "payment" },
  { id: 4, officer: "Vikram D.", action: "Reported Jam", details: "Heavy traffic at Bilaspur Chowk", time: "18 min ago", type: "alert" },
];

export const mapHotspots = [
  { id: 1, lat: 21.25, lng: 81.63, count: 45, name: "Raipur Zone A", trend: "up" },
  { id: 2, lat: 21.20, lng: 81.35, count: 28, name: "Bhilai Sector", trend: "down" },
  { id: 3, lat: 22.08, lng: 82.14, count: 12, name: "Bilaspur North", trend: "stable" },
  { id: 4, lat: 19.10, lng: 81.95, count: 35, name: "Jagdalpur", trend: "up" },
  { id: 5, lat: 23.13, lng: 83.18, count: 18, name: "Ambikapur", trend: "stable" }
];
