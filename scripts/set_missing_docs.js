const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dckfqvywxupmeurimfbq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRja2Zxdnl3eHVwbWV1cmltZmJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzEwMjgyNCwiZXhwIjoyMDk4Njc4ODI0fQ.9Q_9LUcPaLd189oKuFR6EoegHSKBsqCEz5wqsAAisyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Set Abdullah, Ali Raza, Junaid status back to 'Documents Missing'
  const names = ['Abdullah', 'Ali Raza', 'Junaid'];
  
  for (const name of names) {
    const { data, error } = await supabase
      .from('hr_employees')
      .update({ status: 'Documents Missing' })
      .ilike('full_name', `%${name}%`)
      .select();
    
    if (error) console.error(`Error updating ${name}:`, error);
    else console.log(`Updated ${name} to Documents Missing:`, data.map(d => d.full_name));
  }

  const { data: all } = await supabase.from('hr_employees').select('*');
  console.log('\nCurrent employee statuses:');
  all.forEach(e => {
    console.log(`- ${e.full_name} | Status: ${e.status} | Role: ${e.job_title || e.role}`);
  });
}

main();
