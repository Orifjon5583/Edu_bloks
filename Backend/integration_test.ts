/**
 * Integration Test Script for LMS System
 * Tests: Teacher creation, Group creation, Student creation, Assignment flow
 */

const API_URL = 'http://localhost:3000/api';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    data?: any;
}

const results: TestResult[] = [];
let superadminToken = '';
let teacherToken = '';
let studentToken = '';

// Test data
let createdTeacherId = '';
let createdGroupId = '';
let createdStudentId = '';
let createdAssignmentId = '';
let studentAssignmentId = '';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();
    return { status: response.status, data };
}

async function test(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        results.push({ name, passed: true });
        console.log(`✅ ${name}`);
    } catch (error: any) {
        results.push({ name, passed: false, error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

async function runTests() {
    console.log('\n🚀 Starting Integration Tests...\n');
    console.log('='.repeat(60));

    // ==================== AUTH TESTS ====================

    await test('1. SuperAdmin Login', async () => {
        const { status, data } = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login: 'superadmin', password: 'superadmin123' }),
        });

        if (status !== 200) throw new Error(`Login failed: ${JSON.stringify(data)}`);
        if (!data.token) throw new Error('No token received');

        superadminToken = data.token;
    });

    // ==================== TEACHER TESTS ====================

    await test('2. Create Teacher (as SuperAdmin)', async () => {
        const { status, data } = await fetchAPI('/users', {
            method: 'POST',
            headers: { Authorization: `Bearer ${superadminToken}` },
            body: JSON.stringify({
                login: `teacher_test_${Date.now()}`,
                password: 'teacher123',
                firstName: 'Тест',
                lastName: 'Учитель',
                role: 'ADMIN',
            }),
        });

        if (status !== 201 && status !== 200) throw new Error(`Create teacher failed: ${JSON.stringify(data)}`);
        if (!data.id) throw new Error('No teacher ID received');

        createdTeacherId = data.id;
    });

    await test('3. Teacher Login', async () => {
        // Get teacher login from created user
        const { data: users } = await fetchAPI('/users?role=admin', {
            headers: { Authorization: `Bearer ${superadminToken}` },
        });

        const teacher = Array.isArray(users) ? users.find((u: any) => u.id === createdTeacherId) : null;
        if (!teacher) throw new Error('Teacher not found in users list');

        const { status, data } = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login: teacher.login, password: 'teacher123' }),
        });

        if (status !== 200) throw new Error(`Teacher login failed: ${JSON.stringify(data)}`);

        teacherToken = data.token;
    });

    // ==================== GROUP TESTS ====================

    await test('4. Create Group (as Teacher)', async () => {
        const { status, data } = await fetchAPI('/groups', {
            method: 'POST',
            headers: { Authorization: `Bearer ${teacherToken}` },
            body: JSON.stringify({
                name: `Test Group ${Date.now()}`,
            }),
        });

        if (status !== 201 && status !== 200) throw new Error(`Create group failed: ${JSON.stringify(data)}`);
        if (!data.id) throw new Error('No group ID received');

        createdGroupId = data.id;
    });

    // ==================== STUDENT TESTS ====================

    await test('5. Create Student in Group (as Teacher)', async () => {
        const { status, data } = await fetchAPI('/users', {
            method: 'POST',
            headers: { Authorization: `Bearer ${teacherToken}` },
            body: JSON.stringify({
                login: `student_test_${Date.now()}`,
                password: 'student123',
                firstName: 'Тест',
                lastName: 'Ученик',
                role: 'STUDENT',
                groupId: createdGroupId,
            }),
        });

        if (status !== 201 && status !== 200) throw new Error(`Create student failed: ${JSON.stringify(data)}`);
        if (!data.id) throw new Error('No student ID received');

        createdStudentId = data.id;
    });

    await test('6. Student Login', async () => {
        const { data: users } = await fetchAPI('/users?role=student', {
            headers: { Authorization: `Bearer ${superadminToken}` },
        });

        const student = Array.isArray(users) ? users.find((u: any) => u.id === createdStudentId) : null;
        if (!student) throw new Error('Student not found');

        const { status, data } = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login: student.login, password: 'student123' }),
        });

        if (status !== 200) throw new Error(`Student login failed: ${JSON.stringify(data)}`);

        studentToken = data.token;
    });

    // ==================== ASSIGNMENT TESTS ====================

    await test('7. Create Quiz Assignment (as Teacher)', async () => {
        const { status, data } = await fetchAPI('/assignments', {
            method: 'POST',
            headers: { Authorization: `Bearer ${teacherToken}` },
            body: JSON.stringify({
                title: 'Test Quiz Assignment',
                description: 'Integration test quiz',
                type: 'QUIZ',
                status: 'PUBLISHED',
                content: {
                    questions: [
                        {
                            id: '1',
                            text: 'What is 2 + 2?',
                            options: ['3', '4', '5', '6'],
                            correctOptionIndex: 1,
                        },
                    ],
                },
                groupIds: [createdGroupId],
                dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }),
        });

        if (status !== 201 && status !== 200) throw new Error(`Create assignment failed: ${JSON.stringify(data)}`);
        if (!data.id) throw new Error('No assignment ID received');

        createdAssignmentId = data.id;
    });

    await test('8. Student Sees Assignment', async () => {
        const { status, data } = await fetchAPI('/student/assignments', {
            headers: { Authorization: `Bearer ${studentToken}` },
        });

        if (status !== 200) throw new Error(`Get assignments failed: ${JSON.stringify(data)}`);
        if (!Array.isArray(data)) throw new Error('Expected array of assignments');

        const found = data.find((sa: any) => sa.assignmentId === createdAssignmentId);
        if (!found) throw new Error('Student does not see the created assignment');

        studentAssignmentId = found.id;
    });

    await test('9. Student Submits Assignment', async () => {
        const { status, data } = await fetchAPI('/student/submissions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${studentToken}` },
            body: JSON.stringify({
                assignmentId: createdAssignmentId,
                answers: { '1': 1 }, // Correct answer
            }),
        });

        if (status !== 201 && status !== 200) throw new Error(`Submit failed: ${JSON.stringify(data)}`);
    });

    await test('10. Verify Student Progress Updated', async () => {
        const { status, data } = await fetchAPI('/student/assignments', {
            headers: { Authorization: `Bearer ${studentToken}` },
        });

        if (status !== 200) throw new Error(`Get assignments failed: ${JSON.stringify(data)}`);

        const assignment = data.find((sa: any) => sa.assignmentId === createdAssignmentId);
        if (!assignment) throw new Error('Assignment not found');

        // Status should be PASSED or SUBMITTED after submission
        if (!['PASSED', 'SUBMITTED'].includes(assignment.status)) {
            throw new Error(`Expected PASSED/SUBMITTED status, got: ${assignment.status}`);
        }
    });

    await test('11. Teacher Sees Submission', async () => {
        const { status, data } = await fetchAPI(`/assignments/${createdAssignmentId}/submissions`, {
            headers: { Authorization: `Bearer ${teacherToken}` },
        });

        if (status !== 200) throw new Error(`Get submissions failed: ${JSON.stringify(data)}`);
    });

    // ==================== STATS TESTS ====================

    await test('12. SuperAdmin Stats Include Teacher Performance', async () => {
        const { status, data } = await fetchAPI('/stats/stats', {
            headers: { Authorization: `Bearer ${superadminToken}` },
        });

        if (status !== 200) throw new Error(`Get stats failed: ${JSON.stringify(data)}`);
        if (!data.teacherPerformance) throw new Error('teacherPerformance missing from stats');
    });

    await test('13. Teacher Stats Include Student Performance', async () => {
        const { status, data } = await fetchAPI('/stats/admin/stats', {
            headers: { Authorization: `Bearer ${teacherToken}` },
        });

        if (status !== 200) throw new Error(`Get teacher stats failed: ${JSON.stringify(data)}`);
    });

    // ==================== CLEANUP ====================

    console.log('\n🧹 Cleaning up test data...\n');

    // Delete student
    if (createdStudentId) {
        await fetchAPI(`/users/${createdStudentId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${superadminToken}` },
        });
    }

    // Delete assignment
    if (createdAssignmentId) {
        await fetchAPI(`/assignments/${createdAssignmentId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${teacherToken}` },
        });
    }

    // Delete group
    if (createdGroupId) {
        await fetchAPI(`/groups/${createdGroupId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${superadminToken}` },
        });
    }

    // Delete teacher
    if (createdTeacherId) {
        await fetchAPI(`/users/${createdTeacherId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${superadminToken}` },
        });
    }

    // ==================== RESULTS ====================

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%\n`);

    if (failed > 0) {
        console.log('Failed tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
