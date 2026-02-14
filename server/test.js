// Test vote submission
const testVote = {
  centerCode: "CTR1-8K3N-PLM9",
  results: [
    { party: "Amuneke Party", votes: 150 },
    { party: "WayForward Party", votes: 120 },
    { party: "I Must Win", votes: 80 }
  ],
  officer: {
    name: "Test Officer",
    phone: "08012345678",
    nin: "12345678901"
  }
};

fetch('http://localhost:3000/submit-vote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testVote)
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch((error) => {
  console.error('Error:', error);
});