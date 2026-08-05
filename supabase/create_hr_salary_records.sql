-- Create HR Salary Records table
CREATE TABLE IF NOT EXISTS hr_salary_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    month VARCHAR NOT NULL, -- Format: YYYY-MM
    base_salary NUMERIC NOT NULL DEFAULT 0,
    commission_earned NUMERIC NOT NULL DEFAULT 0,
    absence_deduction NUMERIC NOT NULL DEFAULT 0,
    loan_deduction NUMERIC NOT NULL DEFAULT 0,
    gross_salary NUMERIC NOT NULL DEFAULT 0,
    net_salary NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one record per employee per month in an organization
    CONSTRAINT hr_salary_records_emp_month_org_unique UNIQUE (employee_id, month, organization_id)
);

-- Enable RLS
ALTER TABLE hr_salary_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization's salary records"
    ON hr_salary_records FOR SELECT
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can insert their organization's salary records"
    ON hr_salary_records FOR INSERT
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update their organization's salary records"
    ON hr_salary_records FOR UPDATE
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can delete their organization's salary records"
    ON hr_salary_records FOR DELETE
    USING (organization_id = public.get_user_org_id());
