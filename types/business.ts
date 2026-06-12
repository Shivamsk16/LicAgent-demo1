export interface Customer {
  id: string;
  tenant_id: string;
  assigned_agent_id: string;
  customer_code: string | null;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  occupation: string | null;
  annual_income: number | null;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  pan_number: string | null;
  aadhaar_last4: string | null;
  nominee_name: string | null;
  nominee_relation: string | null;
  nominee_dob: string | null;
  kyc_status: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  agent?: { full_name: string };
}

export interface Policy {
  id: string;
  tenant_id: string;
  customer_id: string;
  agent_id: string;
  policy_number: string;
  plan_name: string;
  plan_code: string | null;
  policy_type: string;
  sum_assured: number;
  premium_amount: number;
  premium_frequency: string;
  premium_term_years: number | null;
  policy_term_years: number | null;
  commencement_date: string;
  maturity_date: string | null;
  last_premium_date: string | null;
  next_premium_due: string | null;
  status: string;
  mode_of_payment: string | null;
  notes: string | null;
  rider_details: unknown[];
  customer?: { id: string; full_name: string; phone?: string };
  agent?: { full_name: string };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  policy_id?: string;
  payment_date: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  late_fee: number;
  installment_number: number;
  payment_mode: string | null;
  receipt_number: string | null;
  status: string;
  remarks: string | null;
  policy?: { policy_number: string; plan_name: string };
  customer?: { full_name: string; phone?: string; customer_code?: string };
  recorder?: { full_name: string };
}
