export type LeadStatus = 
  | "New Lead" 
  | "Contacted" 
  | "Interested" 
  | "Site Visit Scheduled" 
  | "Negotiation" 
  | "Deal Closed" 
  | "Not Interested";

export type LeadSource = "Website" | "Facebook Ads" | "Google Ads" | "Manual";

export type PropertyInterest = "Plot A" | "Plot B" | "Plot C" | "Farm Land" | "Commercial Plot" | "Residential Plot";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  budget: string;
  propertyInterest: PropertyInterest;
  source: LeadSource;
  assignedAgent: string;
  assignedAgentName: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  leadsAssigned: number;
  dealsClosed: number;
}
