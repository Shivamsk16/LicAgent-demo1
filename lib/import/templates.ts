export type ImportType = "customers" | "policies" | "payments";

export const IMPORT_TEMPLATES: Record<ImportType, string> = {
  customers: `Customer Full Name,Date of Birth (DD/MM/YYYY),Gender,Phone Number,Alternate Phone,Email,City,State,Pincode,PAN Number,Aadhaar Last 4 Digits,Nominee Name,Nominee Relation,Notes,Agent Employee ID
Ramesh Kumar,15/08/1985,male,9876543210,,ramesh@example.com,Mumbai,Maharashtra,400001,ABCDE1234F,1234,Sita Kumar,spouse,Sample row,EMP-001`,

  policies: `Policy Number,Customer Phone,Plan Name,Plan Code,Policy Type,Sum Assured,Premium Amount,Premium Frequency,Policy Term (Years),Premium Term (Years),Commencement Date (DD/MM/YYYY),Maturity Date (DD/MM/YYYY),Status,Mode of Payment,Notes
LIC1234567890,9876543210,Jeevan Anand,814,endowment,500000,2500,monthly,20,20,01/04/2024,01/04/2044,in_force,nach,Sample policy`,

  payments: `Policy Number,Payment Date (DD/MM/YYYY),Due Date (DD/MM/YYYY),Amount Due,Amount Paid,Installment Number,Payment Mode,Receipt Number,Remarks
LIC1234567890,05/04/2024,01/04/2024,2500,2500,1,nach,RCP-001,Sample payment`,
};
