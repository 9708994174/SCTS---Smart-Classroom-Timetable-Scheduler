/**
 * Test script for authentication endpoints
 * Run with: node backend/scripts/testAuth.js
 */

require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const testAuth = async () => {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing User Registration...');
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'test123456',
      role: 'student',
      department: 'CSE'
    };

    const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('✅ Registration successful!');
    console.log('   User ID:', registerResponse.data.data.user.id);
    console.log('   Token received:', registerResponse.data.data.token ? 'Yes' : 'No');
    console.log('');

    // Test 2: Login with registered user
    console.log('2️⃣ Testing User Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    console.log('✅ Login successful!');
    console.log('   User:', loginResponse.data.data.user.name);
    console.log('   Role:', loginResponse.data.data.user.role);
    console.log('   Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
    console.log('');

    // Test 3: Get current user (with token)
    console.log('3️⃣ Testing Get Current User...');
    const token = loginResponse.data.data.token;
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Get current user successful!');
    console.log('   User:', meResponse.data.data.name);
    console.log('   Email:', meResponse.data.data.email);
    console.log('');

    // Test 4: Test invalid login
    console.log('4️⃣ Testing Invalid Login...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: registerData.email,
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login correctly rejected!');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 All tests passed! Authentication is working correctly.');
    console.log('\n📝 Test User Credentials:');
    console.log(`   Email: ${registerData.email}`);
    console.log(`   Password: ${registerData.password}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
};

// Check if server is running
axios.get(`${API_URL}/health`)
  .then(() => {
    console.log('✅ Server is running\n');
    testAuth();
  })
  .catch((error) => {
    console.error('❌ Server is not running!');
    console.error('   Please start the server first: npm run dev');
    console.error('   Error:', error.message);
    process.exit(1);
  });




