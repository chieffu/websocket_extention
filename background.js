 let serverSocketSingleton;

 function getWebSocket() {
   if (serverSocketSingleton && serverSocketSingleton.readyState === WebSocket.OPEN) {
     return serverSocketSingleton;
   }

   // 使用闭包确保 WebSocket 实例的创建和初始化过程只执行一次
   const createAndInitializeWebSocket = (() => {
     let initialized = false;
     return () => {
       if (!initialized) {
         const wsUrl = 'ws://localhost/allbet'; // 替换为实际的WebSocket服务端URL
         const socket = new WebSocket(wsUrl);

         socket.addEventListener('open', function (event) {
           console.log('WebSocket connection established.');
           // 可在此处发送初始化消息或设置心跳检测等
         });

         socket.addEventListener('message', function (event) {
           console.log('Received message:', event.data);
           // 在此处处理接收到的服务器消息
         });

         socket.addEventListener('close', function (event) {
           console.log('WebSocket connection closed:', event.code, event.reason);
           // 可在此处设置重连逻辑
         });

         socket.addEventListener('error', function (event) {
           console.error('WebSocket error:', event);
           // 在此处处理连接错误
         });

         serverSocketSingleton = socket;
         initialized = true;
       }
       return serverSocketSingleton;
     };
   })();

   return createAndInitializeWebSocket();
 }
serverSocketSingleton = getWebSocket();
   // 初始化连接


// 切换标签页事件
const attachedTabs = new Map(); // 用于存储已添加调试器的标签页 ID
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    if (!tab) {
      console.error('Failed to retrieve tab information.');
      return;
    }

    if (!isInternalURL(tab.url)) {
      console.log('Enable debugging for tab', tab);
      enableWebSocketDebuggingForTab(tab);
    } else {
      console.log('Skipped attaching debugger to internal URL:', tab.url);
    }
  });
});

// 封装功能为单独的函数
function enableWebSocketDebuggingForTab(tab) {
  chrome.debugger.attach({
    tabId: tab.id
  }, '1.3', () => {
    if (attachedTabs.has(tab.id)) {
      console.log(`Debugger already attached to tab ${tab.id}. Skipping.`);
    } else {
      chrome.debugger.sendCommand({
        tabId: tab.id
      }, 'Network.enable');
    }
    attachedTabs.set(tab.id, true);
    chrome.debugger.onEvent.addListener((source, method, params) => {
      // console.log(`debugger on event ${source}  ${method}  ${params}`);
      if (method === 'Network.webSocketFrameReceived' && source.tabId === tab.id) {
        const {
          requestId,
          timestamp,
          response
        } = params;
        const {
          opcode,
          mask,
          payloadData
        } = response;
       // console.log('WebSocket frame received:', params);
        let payloadDisplay;
        if (opcode === 1 ) {
          // 二进制帧或者无掩码，直接输出原始 base64 数据
          payloadDisplay = payloadData;
          getWebSocket().send(payloadData)
        }
     }

    });
  });
}

// 查询当前窗口的所有非隐藏标签页并尝试启用WebSocket调试功能
chrome.tabs.query({
  active: true,
  currentWindow: true
}, (tabs) => {
  for (const tab of tabs) {
    if (!isInternalURL(tab.url)) {
      console.log('enable debugging for tab ', tab);

      enableWebSocketDebuggingForTab(tab);

    } else {
      console.log(`Skipped attaching debugger to internal URL: ${tab.url}`);
    }
  }
});

function isInternalURL(url) {
  return url.startsWith('chrome://') || url.startsWith('about:');
}

console.log("web socket monitor background.js is loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendWebSocketMessage') {
    console.log('Received message from popup. script:', request.message);
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'sendWebSocketMessage',
        message: request.message
      });
    });
  }
});


