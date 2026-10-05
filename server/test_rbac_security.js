// test_rbac_security.js
// Automated verification suite for Role-Based Access Control and Security Enforcement

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    method: options.method || 'GET',
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`\x1b[31m✖ FAIL:\x1b[0m ${testName} - ${details}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🔒 QUEUELESS RBAC & SECURITY VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // 1. Unauthenticated Access Protection
  console.log('--- 1. Testing Unauthenticated Access Rejection (401) ---');
  const unauthStudent = await request('/student/dashboard');
  assert(unauthStudent.status === 401, 'Anonymous GET /api/student/dashboard returns 401', `Got ${unauthStudent.status}`);

  const unauthStaff = await request('/staff/dashboard');
  assert(unauthStaff.status === 401, 'Anonymous GET /api/staff/dashboard returns 401', `Got ${unauthStaff.status}`);

  const unauthAdmin = await request('/admin/overview');
  assert(unauthAdmin.status === 401, 'Anonymous GET /api/admin/overview returns 401', `Got ${unauthAdmin.status}`);

  // 2. Authentication and Role Token Issuance
  console.log('\n--- 2. Testing Authentication & Role Issuance ---');
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'student@queueless.edu', password: 'student123' }
  });
  assert(studentLogin.status === 200 && studentLogin.data.user.role === 'student', 'Student login returns valid token with role "student"');
  const studentToken = studentLogin.data?.token;

  const staffLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'staff@queueless.edu', password: 'staff123' }
  });
  assert(staffLogin.status === 200 && staffLogin.data.user.role === 'staff', 'Staff login returns valid token with role "staff"');
  const staffToken = staffLogin.data?.token;

  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@queueless.edu', password: 'admin123' }
  });
  assert(adminLogin.status === 200 && adminLogin.data.user.role === 'admin', 'Admin login returns valid token with role "admin"');
  const adminToken = adminLogin.data?.token;

  // 3. Student Role Authorization & Isolation
  console.log('\n--- 3. Testing Student Role Permissions & Strict Isolation ---');
  const studentSelf = await request('/student/dashboard', { token: studentToken });
  assert(studentSelf.status === 200, 'Student can access /api/student/dashboard', `Got ${studentSelf.status}`);

  const studentToStaff = await request('/staff/dashboard', { token: studentToken });
  assert(studentToStaff.status === 403, 'Student is blocked (403) from /api/staff/dashboard', `Got ${studentToStaff.status}`);

  const studentToStaffCall = await request('/staff/queue/call-next', {
    method: 'POST',
    token: studentToken,
    body: { service_id: 1, counter_number: 1 }
  });
  assert(studentToStaffCall.status === 403, 'Student is blocked (403) from /api/staff/queue/call-next', `Got ${studentToStaffCall.status}`);

  const studentToAdminOverview = await request('/admin/overview', { token: studentToken });
  assert(studentToAdminOverview.status === 403, 'Student is blocked (403) from /api/admin/overview', `Got ${studentToAdminOverview.status}`);

  const studentToAdminUsers = await request('/admin/users', { token: studentToken });
  assert(studentToAdminUsers.status === 403, 'Student is blocked (403) from /api/admin/users', `Got ${studentToAdminUsers.status}`);

  // 4. Staff Role Authorization & Isolation
  console.log('\n--- 4. Testing Staff Role Permissions & Strict Isolation ---');
  const staffSelf = await request('/staff/dashboard', { token: staffToken });
  assert(staffSelf.status === 200, 'Staff can access /api/staff/dashboard', `Got ${staffSelf.status}`);

  const staffToAdminOverview = await request('/admin/overview', { token: staffToken });
  assert(staffToAdminOverview.status === 403, 'Staff is blocked (403) from /api/admin/overview', `Got ${staffToAdminOverview.status}`);

  const staffToAdminUsers = await request('/admin/users', { token: staffToken });
  assert(staffToAdminUsers.status === 403, 'Staff is blocked (403) from /api/admin/users', `Got ${staffToAdminUsers.status}`);

  // 5. Admin Full Management Permissions
  console.log('\n--- 5. Testing Admin Full Operational & Governance Access ---');
  const adminOverview = await request('/admin/overview', { token: adminToken });
  assert(adminOverview.status === 200, 'Admin can access /api/admin/overview', `Got ${adminOverview.status}`);

  const adminUsers = await request('/admin/users', { token: adminToken });
  assert(adminUsers.status === 200 && Array.isArray(adminUsers.data.users), 'Admin can access /api/admin/users', `Got ${adminUsers.status}`);

  const adminSettings = await request('/admin/settings', { token: adminToken });
  assert(adminSettings.status === 200 && adminSettings.data.settings, 'Admin can access /api/admin/settings', `Got ${adminSettings.status}`);

  // 6. Privilege Escalation Prevention on Registration
  console.log('\n--- 6. Testing Privilege Escalation Mitigation ---');
  const timestamp = Date.now();
  const regAttempt = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Sneaky Attacker',
      email: `attacker_${timestamp}@queueless.edu`,
      password: 'password123',
      role: 'admin' // Attempted privilege escalation
    }
  });
  assert(
    regAttempt.status === 201 && regAttempt.data.user.role === 'student',
    'Registration ignores client-supplied "admin" role and enforces "student"',
    `Returned role: ${regAttempt.data?.user?.role}`
  );

  const attackerToken = regAttempt.data?.token;
  const attackerAdminAccess = await request('/admin/overview', { token: attackerToken });
  assert(attackerAdminAccess.status === 403, 'Registered user cannot access Admin endpoints (403 Forbidden)');

  // 7. IDOR / Ownership Protection on Queue Token Cancellation
  console.log('\n--- 7. Testing IDOR / Broken Object-Level Authorization Protection ---');
  // Clean any preexisting active tokens from prior runs
  const activeRes = await request('/student/queue/active', { token: studentToken });
  if (activeRes.data?.activeTokens) {
    for (const t of activeRes.data.activeTokens) {
      await request(`/student/queue/token/${t.id}/cancel`, {
        method: 'POST',
        token: studentToken,
        body: { reason: 'Test clean state' }
      });
    }
  }

  // Student A joins queue
  const joinQueue = await request('/student/queue/join', {
    method: 'POST',
    token: studentToken,
    body: { service_id: 1, notes: 'Transcript request' }
  });
  const createdTicket = joinQueue.data?.token || joinQueue.data?.entry;

  if (createdTicket && createdTicket.id) {
    // Registered Attacker (Student B) attempts to cancel Student A's ticket
    const idorCancel = await request(`/student/queue/token/${createdTicket.id}/cancel`, {
      method: 'POST',
      token: attackerToken,
      body: { reason: 'Unauthorized cancellation attempt' }
    });
    assert(idorCancel.status === 403, 'Student B cannot cancel Student A\'s queue ticket (403 Forbidden)', `Got ${idorCancel.status}`);

    // Legitimate owner (Student A) cancels their ticket
    const legitimateCancel = await request(`/student/queue/token/${createdTicket.id}/cancel`, {
      method: 'POST',
      token: studentToken,
      body: { reason: 'No longer needed' }
    });
    assert(legitimateCancel.status === 200, 'Legitimate student owner can cancel their own ticket (200 OK)');
  } else {
    console.log('Skipping IDOR ticket test (service may be at limit or already in queue)');
  }

  // 8. Staff Desk Workflow & Token Lifecycle
  console.log('\n--- 8. Testing Staff Desk Workflow & Token Lifecycle ---');
  // Student joins queue
  const newTicketRes = await request('/student/queue/join', {
    method: 'POST',
    token: studentToken,
    body: { service_id: 1, notes: 'Counter service test' }
  });
  const staffTicket = newTicketRes.data?.token || newTicketRes.data?.entry;

  if (staffTicket && staffTicket.id) {
    // Staff calls next ticket for Service 1 at Counter 1
    const callNext = await request('/staff/queue/call-next', {
      method: 'POST',
      token: staffToken,
      body: { service_id: 1, counter_number: 1 }
    });
    assert(callNext.status === 200, 'Staff can call next ticket in queue (200 OK)', `Got ${callNext.status}`);

    // Staff completes the ticket
    const completeTicket = await request(`/staff/queue/${staffTicket.id}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'completed' }
    });
    assert(completeTicket.status === 200, 'Staff can mark ticket status as completed (200 OK)', `Got ${completeTicket.status}`);
  }

  // 9. Public Kiosk / Hallway Display Board Access (Zero Auth Barrier)
  console.log('\n--- 9. Testing Public Lobby / Hallway Display Board Access ---');
  const displayRes = await request('/queues/display');
  assert(
    displayRes.status === 200 && Array.isArray(displayRes.data.services),
    'Anonymous TV / Kiosk display can fetch live queue data (200 OK)',
    `Got ${displayRes.status}`
  );
  assert(
    displayRes.data.services.length > 0 && displayRes.data.settings?.campus_name,
    'Public display payload includes live services, counters, and campus settings'
  );

  // Summary
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
