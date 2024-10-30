// 页面脚本中
window.addEventListener('message', function(event) {
  //if (event.source !== window) return; // 可选：仅处理来自同一窗口的消息
  console.log('Received message from content script:', event);
  if (typeof event.data === 'object' && event.data.action === 'sendWebSocketMessage') {
    const webSocket = findWebSocket();
    if (webSocket) {
      // 在此处执行相应操作
      webSocket.send(event.data.message)
      console.log('send message success');
    }
  }
}, false);

function findWebSocket() {
  // 遍历window对象的所有属性，查找WebSocket实例
  for (let key in window) {
    const value = window[key];
    if (value instanceof WebSocket && value.readyState === WebSocket.OPEN) {
      return value;
    } else if (Array.isArray(value) && value.some((item) => item instanceof WebSocket && item.readyState === WebSocket.OPEN)) {
      return value.find((ws) => ws.readyState === WebSocket.OPEN);
    }
  }
  console.log('no open WebSocket instance found');
  return null; // 若未找到返回null
}