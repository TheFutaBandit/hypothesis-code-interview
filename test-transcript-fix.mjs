// Test script to test transcript saving fix
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/phone';

async function testTranscriptFix() {
  try {
    console.log('Testing transcript saving fix...');
    const phoneNumber = '+918448877273'; // Use a different number
    
    // Step 1: Make a call and wait for completion
    console.log('Step 1: Making call and waiting for completion...');
    const callResponse = await axios.post(`${BASE_URL}/number`, {
      'phone-number': phoneNumber
    });
    
    console.log('Response:', callResponse.data);
    
    if (callResponse.data.status === 'completed_with_transcript') {
      console.log('✅ SUCCESS: Transcript was saved and returned!');
      console.log('Transcript:', callResponse.data.transcript);
    } else {
      console.log('❌ FAILED: Transcript not completed');
      console.log('Status:', callResponse.data.status);
    }
    
  } catch (error) {
    console.error('Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testTranscriptFix();
