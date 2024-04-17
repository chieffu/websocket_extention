// content_script.js
const scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('websocketSendMessage.js');
(document.head || document.documentElement).appendChild(scriptElement);

console.log("web socket monitor content.js is loaded.")

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("received message ", request);
  if (request.action === 'sendWebSocketMessage') {
    sendMessageToPage(request)

  }
});

function sendMessageToPage(message) {
  const targetWindow = window.frames[0] || window; // 对于嵌入式内容脚本，可能是某个特定iframe；对于普通页面脚本，通常是顶层窗口
  targetWindow.postMessage(message, '*'); // 发送消息到页面，'*' 表示任何源都可以接收（确保安全时可指定具体源）
}