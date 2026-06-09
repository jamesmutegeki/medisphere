export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  category: string;
  image: string;
  challenge: string;
  approach: string;
  result: string;
  outcome: string;
  year: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: "1",
    title: "Cross-Border Merger of Two East African Telecom Firms",
    client: "Telco East Africa Ltd & ConnectCom Ltd",
    category: "Mergers & Acquisitions",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    challenge: "Two leading telecom companies sought to merge operations across Kenya, Uganda, and Tanzania. The deal required navigating complex regulatory frameworks in three jurisdictions, competition law approvals, and shareholder agreements across multiple entities.",
    approach: "Our team conducted comprehensive due diligence across all three jurisdictions, negotiated regulatory approvals with national communications authorities, and structured the merger to optimize tax efficiency while ensuring compliance with local laws.",
    result: "The merger was successfully completed within 8 months, creating the largest telecom network in East Africa with combined valuation of $450M. The client saved approximately $2M in tax liabilities through our strategic structuring.",
    outcome: "The merged entity now serves over 15 million subscribers across the region and has seen a 30% increase in operational efficiency.",
    year: "2025",
  },
  {
    id: "2",
    title: "High-Value Commercial Property Acquisition",
    client: "Prime Properties International",
    category: "Real Estate & Property",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop",
    challenge: "A real estate investment firm needed to acquire a portfolio of 12 commercial properties across Kampala valued at $85M. The transactions involved complex title searches, encumbrance verification, and multi-party financing arrangements.",
    approach: "We managed the end-to-end legal process including due diligence, title verification, contract drafting, and negotiation of financing terms with three banks. Our team also resolved two title disputes discovered during the search process.",
    result: "All 12 properties were successfully acquired within the 6-month target timeline. We identified and resolved title defects that could have cost the client $4.2M in potential losses.",
    outcome: "The client's commercial property portfolio has generated a 12% rental yield in the first year, exceeding their initial projections.",
    year: "2025",
  },
  {
    id: "3",
    title: "IP Portfolio Protection for a Fintech Startup",
    client: "PayTech Innovations Ltd",
    category: "Intellectual Property",
    image: "https://images.unsplash.com/photo-1559526324-4bc87bd5ecb6?w=600&h=400&fit=crop",
    challenge: "A rapidly growing fintech startup needed comprehensive IP protection for its mobile payment technology, including patents, trademarks, and trade secrets across five African countries.",
    approach: "We developed a multi-jurisdictional IP strategy, filed patent applications for three核心技术 innovations, registered trademarks across all target markets, and implemented trade secret protection protocols.",
    result: "All patent applications were filed within 3 months. Trademark registrations were secured in all five countries. The company's IP portfolio was valued at $12M in their subsequent funding round.",
    outcome: "The strengthened IP position helped the startup secure a $25M Series B investment at a valuation of $200M.",
    year: "2024",
  },
  {
    id: "4",
    title: "Employment Restructuring for a Manufacturing Giant",
    client: "East African Manufacturing Corp",
    category: "Employment & Labor",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop",
    challenge: "A manufacturing company with 2,500 employees needed to restructure its workforce due to operational changes while ensuring full compliance with labor laws and minimizing legal exposure.",
    approach: "We conducted a comprehensive labor audit, developed a fair redundancy framework, negotiated severance packages with union representatives, and managed the legal aspects of the restructuring process.",
    result: "The restructuring was completed without any successful legal challenges. Employee claims were minimized, and the company saved $1.8M compared to potential litigation costs.",
    outcome: "The restructured workforce improved productivity by 22%, and the company reported its highest quarterly profits in 5 years.",
    year: "2024",
  },
];
