const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dckfqvywxupmeurimfbq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRja2Zxdnl3eHVwbWV1cmltZmJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzEwMjgyNCwiZXhwIjoyMDk4Njc4ODI0fQ.9Q_9LUcPaLd189oKuFR6EoegHSKBsqCEz5wqsAAisyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: employees, error } = await supabase.from('hr_employees').select('*');
  if (error) {
    console.error('Error fetching employees:', error);
    return;
  }

  console.log('Total employees in DB:', employees.length);
  employees.forEach(e => {
    console.log(`- ${e.full_name} | Role: ${e.job_title || e.role} | Status: ${e.status} | Salary: ${e.base_salary}`);
  });

  // Update any employees that have status !== 'Active' (like 'Documents Missing') to 'Active'
  const nonActive = employees.filter(e => e.status !== 'Active');
  console.log(`\nFound ${nonActive.length} non-active employees:`, nonActive.map(e => `${e.full_name} (${e.status})`));

  if (nonActive.length > 0) {
    const { data: updated, error: updateErr } = await supabase
      .from('hr_employees')
      .update({ status: 'Active' })
      .in('id', nonActive.map(e => e.id))
      .select();

    if (updateErr) {
      console.error('Update error:', updateErr);
    } else {
      console.log(`Successfully updated ${updated.length} employees to Active!`);
    }
  }

  // Verify final active counts
  const { data: finalEmployees } = await supabase.from('hr_employees').select('*');
  const activeAll = finalEmployees.filter(e => e.status === 'Active');
  const officeBoys = activeAll.filter(e => (e.job_title || '').toLowerCase().includes('office boy') || (e.role || '').toLowerCase().includes('office boy'));
  const regularEmployees = activeAll.length - officeBoys.length;

  console.log(`\nFinal Summary:`);
  console.log(`Total Staff: ${finalEmployees.length}`);
  console.log(`Active Staff: ${activeAll.length}`);
  console.log(`Active Employees: ${regularEmployees}`);
  console.log(`Office Boys: ${officeBoys.length}`);
}

main();
