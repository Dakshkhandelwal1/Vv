
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const generateBtn = document.getElementById('generateBtn');

async function addMessage(content, role, imageUrl = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  messageDiv.textContent = content;

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'generated-image';
    img.alt = 'AI Generated Image';
    messageDiv.appendChild(img);
  }

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function generateImage() {
  const prompt = userInput.value.trim();
  if (!prompt) return;

  // Disable input during generation
  generateBtn.disabled = true;
  userInput.disabled = true;

  try {
    // Add user message
    addMessage(prompt, 'user');
    userInput.value = '';

    // Add loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message loading';
    loadingDiv.textContent = 'Generating image';
    chatContainer.appendChild(loadingDiv);

    // Make API request
    const response = await fetch('/api/chats/1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: prompt,
        role: 'user'
      })
    });

    const messages = await response.json();
    
    // Remove loading message
    chatContainer.removeChild(loadingDiv);

    // Add AI response
    const aiMessage = messages[1];
    if (aiMessage) {
      addMessage(aiMessage.content, 'assistant', aiMessage.imageUrl);
    }

  } catch (error) {
    console.error('Error:', error);
    addMessage('Sorry, there was an error generating the image.', 'assistant');
  } finally {
    // Re-enable input
    generateBtn.disabled = false;
    userInput.disabled = false;
  }
}

generateBtn.addEventListener('click', generateImage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    generateImage();
  }
});
