
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const generateBtn = document.getElementById('generateBtn');
const sidebar = document.getElementById('sidebar');
let currentChatId = null;

async function createNewChat() {
  try {
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'New Chat'
      })
    });
    const chat = await response.json();
    currentChatId = chat.id;
    loadChats();
    return chat;
  } catch (error) {
    console.error('Error creating chat:', error);
  }
}

async function loadChats() {
  try {
    const response = await fetch('/api/chats');
    const chats = await response.json();
    sidebar.innerHTML = '';
    
    chats.forEach(chat => {
      const chatElement = document.createElement('div');
      chatElement.className = 'chat-item';
      chatElement.textContent = chat.title;
      chatElement.onclick = () => selectChat(chat.id);
      sidebar.appendChild(chatElement);
    });
  } catch (error) {
    console.error('Error loading chats:', error);
  }
}

async function selectChat(chatId) {
  currentChatId = chatId;
  chatContainer.innerHTML = '';
  try {
    const response = await fetch(`/api/chats/${chatId}/messages`);
    const messages = await response.json();
    messages.forEach(message => {
      addMessage(message.content, message.role, message.imageUrl);
    });
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

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
  if (!currentChatId) {
    const chat = await createNewChat();
    currentChatId = chat.id;
  }

  const prompt = userInput.value.trim();
  if (!prompt) return;

  generateBtn.disabled = true;
  userInput.disabled = true;

  try {
    addMessage(prompt, 'user');
    userInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message loading';
    loadingDiv.textContent = 'Generating image';
    chatContainer.appendChild(loadingDiv);

    const response = await fetch(`/api/chats/${currentChatId}/messages`, {
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
    chatContainer.removeChild(loadingDiv);
    
    if (messages[1]) {
      addMessage(messages[1].content, 'assistant', messages[1].imageUrl);
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage('Sorry, there was an error generating the image.', 'assistant');
  } finally {
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

// Load initial chats
loadChats();
