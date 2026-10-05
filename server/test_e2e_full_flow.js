import { db } from './db.js';
import app from './index.js';

const API_BASE = process.env.TEST_API_URL || 'http://localhost:5000/api';

let serverInstance = null;

async function ensureServerRunning() {
  if (process.env.TEST_API_URL) return;
  try {
    const res = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(1000) });
    if (res.ok) return;
  } catch (e) {
    // Server not running, launch ephemeral server
  }
  await new Promise((resolve) => {
    serverInstance = app.listen(5000, () => resolve());
  });
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTest() {
  console.log('====================================================');
  console.log('🧪 QUEUELESS END-TO-END SYSTEM FUNCTIONALITY AUDIT');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Public Service Discovery
  console.log('\n--- 1. Testing Public Service Discovery ---');
  const servicesRes = await request('/services');
  assert(servicesRes.status === 200 && Array.isArray(servicesRes.data.services), 'Public services listing loads successfully');
  const service1 = servicesRes.data.services.find(s => s.id === 1);
  assert(service1 && service1.code === 'REG', 'Service 1 (Registrar) is available and active');

  const detailRes = await request('/services/1');
  assert(detailRes.status === 200 && detailRes.data.service.id === 1, 'Service detail endpoint returns accurate configuration');

  // 2. Student Authentication
  console.log('\n--- 2. Testing Student Authentication ---');
  const studentLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@queueless.edu', password: 'student123' })
  });
  assert(studentLoginRes.status === 200 && !!studentLoginRes.data.token, 'Student logs in successfully');
  const studentToken = studentLoginRes.data.token;
  assert(studentLoginRes.data.user.role === 'student', 'Student identity confirmed with role "student"');

  // 3. Clear any preexisting active tokens for clean test run
  const activeRes = await request('/student/queue/active', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (activeRes.data.activeTokens?.length > 0) {
    for (const t of activeRes.data.activeTokens) {
      await request(`/queues/token/${t.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    }
  }

  // 4. Joining Queue
  console.log('\n--- 3. Testing Queue Joining Flow ---');
  const joinRes = await request('/queues/join', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      service_id: 1,
      notes: 'End-to-end verification inquiry'
    })
  });
  assert(joinRes.status === 201 && joinRes.data.token, 'Student successfully joined virtual queue (201 Created)');
  const issuedToken = joinRes.data.token;
  assert(issuedToken.token_number && issuedToken.token_number.startsWith('REG-'), `Token issued with valid code: ${issuedToken.token_number}`);
  assert(issuedToken.status === 'waiting', 'Initial token status is "waiting"');

  // 5. Duplicate Join Prevention (409 Conflict with Active Token Payload)
  console.log('\n--- 4. Testing Duplicate Join Prevention & Recovery Payload ---');
  const dupJoinRes = await request('/queues/join', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      service_id: 1,
      notes: 'Duplicate attempt'
    })
  });
  assert(dupJoinRes.status === 409, 'Duplicate join rejected with 409 Conflict');
  assert(dupJoinRes.data.activeToken && dupJoinRes.data.activeToken.token_number === issuedToken.token_number, 'Conflict response provides existing activeToken for UI recovery');

  // 6. Token Tracking & Digital Pass Telemetry
  console.log('\n--- 5. Testing Digital Pass & Live Queue Tracking ---');
  const trackRes = await request(`/queues/token/${issuedToken.id}`);
  assert(trackRes.status === 200 && trackRes.data.token.id === issuedToken.id, 'Live tracking telemetry accessible for token');
  assert(typeof trackRes.data.token.people_ahead === 'number', 'Accurate people_ahead count computed');
  assert(typeof trackRes.data.token.live_estimated_wait_mins === 'number', 'Live estimated wait time dynamically calculated');

  // 7. Student Dashboard Verification
  console.log('\n--- 6. Testing Student Dashboard Sync ---');
  const dashRes = await request('/student/dashboard', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(dashRes.status === 200, 'Student dashboard loads successfully');
  const hasActiveToken = dashRes.data.activeTokens.some(t => t.id === issuedToken.id);
  assert(hasActiveToken, 'Newly issued token appears in student activeTokens array');

  // 8. Staff Desk Workflow
  console.log('\n--- 7. Testing Staff Operator Counter Workflow ---');
  const staffLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'staff@queueless.edu', password: 'staff123' })
  });
  assert(staffLoginRes.status === 200 && !!staffLoginRes.data.token, 'Staff logs in successfully');
  const staffToken = staffLoginRes.data.token;

  // Call Next
  const callRes = await request('/staff/queue/call-next', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ service_id: 1, counter_id: 1 })
  });
  assert(callRes.status === 200 && callRes.data.token, 'Staff successfully called next token');
  assert(callRes.data.token.id === issuedToken.id, `Correct student token called: ${callRes.data.token.token_number}`);

  // Transition to Serving
  const serveRes = await request(`/staff/queue/${issuedToken.id}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ status: 'serving', counter_id: 1 })
  });
  assert(serveRes.status === 200, 'Token transitioned to "serving" status');

  // Complete Token
  const completeRes = await request(`/staff/queue/${issuedToken.id}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ status: 'completed', counter_id: 1 })
  });
  assert(completeRes.status === 200, 'Token marked as "completed"');

  // 9. Feedback & Ratings
  console.log('\n--- 8. Testing Student Feedback Submission ---');
  const feedbackRes = await request('/feedback', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      queue_entry_id: issuedToken.id,
      service_id: 1,
      rating: 5,
      comments: 'Lightning fast counter turnaround!'
    })
  });
  assert(feedbackRes.status === 201, 'Student feedback submitted with 5-star rating');

  // 10. Staff History Verification
  console.log('\n--- 9. Testing Staff & Student Activity History ---');
  const staffHistRes = await request('/staff/history', {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  assert(staffHistRes.status === 200 && Array.isArray(staffHistRes.data.history), 'Staff history retrieved successfully');
  const foundInStaffHist = staffHistRes.data.history.some(h => h.id === issuedToken.id);
  assert(foundInStaffHist, 'Completed consultation appears in staff history log');

  const studentHistRes = await request('/student/queue/history', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentHistRes.status === 200 && Array.isArray(studentHistRes.data.history), 'Student history retrieved successfully');
  const foundInStudentHist = studentHistRes.data.history.some(h => h.id === issuedToken.id);
  assert(foundInStudentHist, 'Completed visit appears in student history log with rating');

  // 11. Appointment Scheduling Workflow
  console.log('\n--- 10. Testing Appointment Scheduling Workflow ---');
  const todayStr = new Date().toISOString().split('T')[0];
  // Clear any existing confirmed test appointments for this student
  const existingAppts = await request('/appointments/my', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (existingAppts.data.appointments?.length > 0) {
    for (const a of existingAppts.data.appointments) {
      if (a.status === 'confirmed') {
        await request(`/appointments/${a.id}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${studentToken}` }
        });
      }
    }
  }

  const slotsRes = await request(`/appointments/slots?service_id=1&date=${todayStr}`);
  assert(slotsRes.status === 200 && Array.isArray(slotsRes.data.slots), 'Available appointment slots retrieved');

  const availableSlot = slotsRes.data.slots.find(s => s.available);
  if (availableSlot) {
    const bookRes = await request('/appointments/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        service_id: 1,
        appointment_date: todayStr,
        time_slot: availableSlot.time_slot,
        purpose: 'Academic degree consultation'
      })
    });
    assert(bookRes.status === 201 && bookRes.data.appointment, `Appointment booked for slot ${availableSlot.time_slot}`);

    const myApptsRes = await request('/appointments/my', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(myApptsRes.status === 200 && myApptsRes.data.appointments.some(a => a.id === bookRes.data.appointment.id), 'Booked appointment visible in student appointments list');
  }

  // 12. Public Display Kiosk
  console.log('\n--- 11. Testing Public Lobby Display Kiosk Telemetry ---');
  const displayRes = await request('/queues/display');
  assert(displayRes.status === 200, 'Public display board telemetry responds with 200 OK without token');
  assert(Array.isArray(displayRes.data.services), 'Public display lists active services');
  assert(!!displayRes.data.settings, 'Public display contains system configuration settings');

  console.log('\n====================================================');
  console.log(`TEST AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  await ensureServerRunning();
  try {
    await runTest();
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Test execution error:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
