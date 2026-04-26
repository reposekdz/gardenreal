// Quick test script to check SMS balance and send test SMS
require('dotenv').config();
const axios = require('axios');

const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME || 'grade';
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY;

console.log('Testing SMS Configuration:');
console.log('Username:', AFRICASTALKING_USERNAME);
console.log('API Key:', AFRICASTALKING_API_KEY ? 'Set (length: ' + AFRICASTALKING_API_KEY.length + ')' : 'NOT SET');

async function testSMS() {
    // Test 1: Check Balance
    console.log('\n--- Testing SMS Balance ---');
    try {
        const balanceResponse = await axios.get(
            'https://api.africastalking.com/version1/messaging/wallet-balance',
            {
                headers: {
                    'apiKey': AFRICASTALKING_API_KEY,
                    'Content-Type': 'application/json'
                },
                params: {
                    username: AFRICASTALKING_USERNAME
                }
            }
        );
        console.log('Balance Response:', balanceResponse.data);
    } catch (error) {
        console.log('Balance Check Error:', error.response?.data || error.message);
    }

    // Test 2: Send Test SMS
    console.log('\n--- Testing SMS Send ---');
    const testPhone = '+250780000000'; // Replace with actual test number
    const testMessage = 'Test SMS from Garden TVET School - If you receive this, SMS is working!';

    try {
        const params = new URLSearchParams();
        params.append('username', AFRICASTALKING_USERNAME);
        params.append('to', testPhone);
        params.append('message', testMessage);

        const sendResponse = await axios.post(
            'https://api.africastalking.com/version1/messaging',
            params,
            {
                headers: {
                    'apiKey': AFRICASTALKING_API_KEY,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        console.log('Send Response:', sendResponse.data);
    } catch (error) {
        console.log('Send SMS Error:', error.response?.data || error.message);
    }
}

testSMS();
