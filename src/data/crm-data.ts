import { Lead, Agent, LeadStatus, LeadSource, PropertyInterest } from "@/types/crm";

export const AGENTS: Agent[] = [
  { id: "1", name: "Rahul Sharma", email: "rahul@realty.com", role: "agent", leadsAssigned: 42, dealsClosed: 8 },
  { id: "2", name: "Priya Patel", email: "priya@realty.com", role: "agent", leadsAssigned: 38, dealsClosed: 12 },
  { id: "3", name: "Akash Singh", email: "akash@realty.com", role: "agent", leadsAssigned: 45, dealsClosed: 6 },
  { id: "4", name: "Neha Gupta", email: "neha@realty.com", role: "agent", leadsAssigned: 40, dealsClosed: 10 },
  { id: "5", name: "Vikram Reddy", email: "vikram@realty.com", role: "agent", leadsAssigned: 37, dealsClosed: 9 },
];

export const LEAD_STATUSES: LeadStatus[] = [
  "New Lead", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Deal Closed", "Not Interested"
];

export const LEAD_SOURCES: LeadSource[] = ["Website", "Facebook Ads", "Google Ads", "Manual"];

export const PROPERTY_INTERESTS: PropertyInterest[] = [
  "Plot A", "Plot B", "Plot C", "Farm Land", "Commercial Plot", "Residential Plot"
];

const names = [
  "Amit Kumar", "Sunita Devi", "Rajesh Verma", "Meena Sharma", "Suresh Yadav",
  "Kavita Singh", "Deepak Joshi", "Anita Mishra", "Vijay Pandey", "Renu Agarwal",
  "Manoj Tiwari", "Pooja Chauhan", "Sanjay Dubey", "Rekha Mehta", "Anil Saxena",
  "Geeta Rawat", "Ramesh Soni", "Sarita Nair", "Prakash Jha", "Nisha Kapoor",
  "Rohit Malhotra", "Anjali Desai", "Karan Bhatia", "Divya Rathi", "Nitin Garg",
  "Swati Bansal", "Pankaj Dhawan", "Simran Kaur", "Gaurav Thakur", "Pallavi Iyer",
];

const locations = ["Mumbai", "Pune", "Delhi", "Noida", "Gurugram", "Bangalore", "Hyderabad", "Jaipur", "Lucknow", "Ahmedabad"];

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export const SAMPLE_LEADS: Lead[] = Array.from({ length: 50 }, (_, i) => {
  const status = LEAD_STATUSES[Math.floor(Math.random() * LEAD_STATUSES.length)];
  const agent = AGENTS[i % 5];
  return {
    id: String(i + 1),
    name: names[i % names.length],
    phone: `+91 ${String(Math.floor(7000000000 + Math.random() * 3000000000))}`,
    email: `${names[i % names.length].toLowerCase().replace(" ", ".")}@email.com`,
    location: locations[Math.floor(Math.random() * locations.length)],
    budget: `₹${(Math.floor(Math.random() * 50) + 5)}L`,
    propertyInterest: PROPERTY_INTERESTS[Math.floor(Math.random() * PROPERTY_INTERESTS.length)],
    source: LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)],
    assignedAgent: agent.id,
    assignedAgentName: agent.name,
    status,
    notes: status === "New Lead" ? "" : "Discussed property options.",
    createdAt: randomDate(new Date(2026, 0, 1), new Date(2026, 2, 6)).toISOString(),
  };
});
