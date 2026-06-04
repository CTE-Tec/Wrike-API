import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxhfbgwmtltpmnndfmwl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aGZiZ3dtdGx0cG1ubmRmbXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDk3MzEsImV4cCI6MjA5NTk4NTczMX0.-8l_ug3lWcDBkQRjfG9_CaY0ysLcI_CrGlWkDmts78A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('projects').select('*').limit(1);
    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      console.log('Success fetching projects! Data:', data);
    }
  } catch (err) {
    console.error('Caught error fetching projects:', err);
  }

  try {
    const { data, error } = await supabase.from('tasks').select('*').limit(1);
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      console.log('Success fetching tasks! Data:', data);
    }
  } catch (err) {
    console.error('Caught error fetching tasks:', err);
  }

  try {
    const { data, error } = await supabase.from('billing_profiles').select('*').limit(1);
    if (error) {
      console.error('Error fetching billing_profiles:', error);
    } else {
      console.log('Success fetching billing_profiles! Data:', data);
    }
  } catch (err) {
    console.error('Caught error fetching billing_profiles:', err);
  }

  try {
    const { data, error } = await supabase.from('contract_details').select('*').limit(1);
    if (error) {
      console.error('Error fetching contract_details:', error);
    } else {
      console.log('Success fetching contract_details! Data:', data);
    }
  } catch (err) {
    console.error('Caught error fetching contract_details:', err);
  }
}

run();
