
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const generateBtn = document.getElementById('generateBtn');
const sidebar = document.getElementById('sidebar');
const newChatBtn = document.getElementById('newChatBtn');
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
    chatContainer.innerHTML = '';
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
      chatElement.textContent = `Chat ${chat.id}`;
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

function createLoadingDots() {
  const dots = document.createElement('div');
  dots.className = 'loading';
  for (let i = 0; i < 3; i++) {
    const span = document.createElement('span');
    dots.appendChild(span);
  }
  return dots;
}

async function addMessage(content, role, imageUrl = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  
  if (content === 'Generating image...') {
    messageDiv.appendChild(createLoadingDots());
  } else {
    messageDiv.textContent = content;
  }

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

document.getElementById('messageForm').addEventListener('submit', (e) => {
  e.preventDefault();
  generateImage();
});

newChatBtn.addEventListener('click', createNewChat);

// Auto-resize textarea
userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// Load initial chats
loadChats();
