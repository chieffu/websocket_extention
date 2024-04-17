document.addEventListener('DOMContentLoaded', () => {
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');

  sendButton.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    if (message) {
         chrome.runtime.sendMessage({ action: 'sendWebSocketMessage', message },(response)=>{
             console.log("response ",response)
         });
         alert('Message sent successfully.');
    } else {
      alert('Please enter a message.');
    }
  });
});

