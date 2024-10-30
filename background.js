let serverSocketSingleton;
let isCreatingWebSocket = false; // 锁变量
let resolveQueue = []; // 用于存储等待的 resolve 函数

 function getWebSocket() {
   return new Promise((resolve, reject) => {
     if (serverSocketSingleton && serverSocketSingleton.readyState === WebSocket.OPEN) {
       resolve(serverSocketSingleton);
       return;
     }

     if (isCreatingWebSocket) {
       // 如果已经有进程在创建 WebSocket 连接，将当前进程加入等待队列
       resolveQueue.push(resolve);
       return;
     }

     isCreatingWebSocket = true;

     const createAndInitializeWebSocket = () => {
       const wsUrl = 'ws://localhost/allbet'; // 替换为实际的 WebSocket 服务端 URL
       const socket = new WebSocket(wsUrl);

       socket.addEventListener('open', function (event) {
         console.log('WebSocket connection established.');
         serverSocketSingleton = socket;
         isCreatingWebSocket = false;

         // 解锁所有等待的进程
         resolveQueue.forEach(res => res(socket));
         resolveQueue = [];

         resolve(socket);
       });

       socket.addEventListener('message', function (event) {
         console.log('Received message:', event.data);
         try {
           sendServerMessageToWebSocket(event.data);
         } catch (e) {
           console.warn('Error sending message:', e);
         }
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
     };

     createAndInitializeWebSocket();
   });
 }
 // 示例调用
 async function sendMessageToServer(message) {
   const socket = await getWebSocket();
   socket.send(message);
 }

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
    if (attachedTabs.has(tab.id)) {
      console.log(`Debugger already attached to tab ${tab.id}. Skipping.`);
      //return;
    }
    chrome.debugger.attach({
        tabId: tab.id
    }, '1.3', () => {
    chrome.debugger.sendCommand({
        tabId: tab.id
     }, 'Network.enable');

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
        if (opcode === 1 ) {
          // 二进制帧或者无掩码，直接输出原始 base64 数据
          sendMessageToServer(payloadData)
        }
     }

    });

    injectWebSocketTracker(tab.id);
  });
}

//给所有websocket发送服务端传来的消息
function sendServerMessageToWebSocket(data){
   attachedTabs.forEach((value, tabId) => {
       chrome.debugger.sendCommand({tabId: tabId}, 'Runtime.evaluate', {
          expression: data,
          returnByValue: true,
         // 传递数据
         // 传递数据
       }, (results) => {
         if (chrome.runtime.lastError) {
           console.error('发送消息时执行脚本报错：')
           console.error(JSON.stringify(chrome.runtime.lastError, null, 2));
         } else {
           console.log('消息发送成功');
         }
       });
  });
}

function injectWebSocketTracker(tabId) {
   const script = `(function() {
     if (window._webSocketTrackerInjected) return;
     window._webSocketTrackerInjected = true;
     // 查找并发送消息到所有处于 OPEN 状态的 WebSocket 实例
     function handleMessage(message) {
       if(window){
           console.log("window :"+window);
           //window.Netbet.component.baseGameHall.sexyHall();
       }
       console.log("message:"+message);
       (function(){eval(message);})()
     }
      // 模拟点击事件
     function simulateClick(element) {
         const clickEvent = new MouseEvent('click', {
             bubbles: true,
             cancelable: true,
             view: window
         });
         element.dispatchEvent(clickEvent);
     }
     // 暴露方法供外部调用
     window.handleMessage = handleMessage;
     window.simulateClick = simulateClick;
     console.log('WebSocket tracker injected successfully.');
   })();
    `;

  chrome.debugger.sendCommand({tabId: tabId}, 'Runtime.evaluate', {
    expression: script,
    returnByValue: true
  }, function(result) {
    if (chrome.runtime.lastError) {
       console.error(JSON.stringify(chrome.runtime.lastError, null, 2));
    }
  });
}

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


