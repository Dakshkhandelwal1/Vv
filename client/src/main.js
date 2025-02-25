
let currentChatId = null;

function addMessage(content, role, imageUrl = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  
  const textSpan = document.createElement('span');
  textSpan.textContent = content;
  messageDiv.appendChild(textSpan);

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

async function loadChats() {
  try {
    const response = await fetch('/api/chats');
    const chats = await response.json();
    
    sidebar.innerHTML = '';
    chats.forEach(chat => {
      const chatDiv = document.createElement('div');
      chatDiv.className = 'chat-item';
      chatDiv.textContent = chat.title;
      chatDiv.onclick = () => loadChat(chat.id);
      sidebar.appendChild(chatDiv);
    });
  } catch (error) {
    console.error('Error loading chats:', error);
  }
}

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
    chatContainer.innerHTML = '';
    await loadChats();
    return chat;
  } catch (error) {
    console.error('Error creating chat:', error);
  }
}

async function loadChat(chatId) {
  try {
    currentChatId = chatId;
    const response = await fetch(`/api/chats/${chatId}/messages`);
    const messages = await response.json();
    
    chatContainer.innerHTML = '';
    messages.forEach(msg => {
      addMessage(msg.content, msg.role, msg.imageUrl);
    });
  } catch (error) {
    console.error('Error loading chat:', error);
  }
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

    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message assistant-message';
    loadingMessage.innerHTML = '<span class="loading-dots">Generating image</span>';
    chatContainer.appendChild(loadingMessage);

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
    
    chatContainer.removeChild(loadingMessage);

    if (messages && messages.length > 1 && messages[1].imageUrl) {
      addMessage(messages[1].content, 'assistant', messages[1].imageUrl);
    } else {
      addMessage('Failed to generate image. Please try again.', 'assistant');
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage('Sorry, there was an error generating the image.', 'assistant');
  } finally {
    generateBtn.disabled = false;
    userInput.disabled = false;
  }
}

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const generateBtn = document.getElementById('generateBtn');
const sidebar = document.getElementById('sidebar');
const newChatBtn = document.getElementById('newChatBtn');

document.getElementById('messageForm').addEventListener('submit', (e) => {
  e.preventDefault();
  generateImage();
});

newChatBtn.addEventListener('click', createNewChat);

userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

loadChats();
