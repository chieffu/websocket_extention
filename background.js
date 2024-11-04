let serverSocketSingleton;
let isCreatingWebSocket = false; // 锁变量
let resolveQueue = []; // 用于存储等待的 resolve 函数
const maxReconnectAttempts = 10; // 最大重连次数
const initialReconnectInterval = 1000; // 初始重连间隔时间，单位为毫秒

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

    let reconnectAttempts = 0; // 当前重连次数

    const createAndInitializeWebSocket = () => {
      const wsUrl = 'ws://localhost/allbet'; // 替换为实际的 WebSocket 服务端 URL
      const socket = new WebSocket(wsUrl);

      socket.addEventListener('open', function (event) {
        console.log('WebSocket connection established.');
        serverSocketSingleton = socket;
        isCreatingWebSocket = false;
        reconnectAttempts = 0; // 重置重连次数

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
        serverSocketSingleton = null;
        attemptReconnect();
      });

      socket.addEventListener('error', function (event) {
        console.error('WebSocket error:', event);
        serverSocketSingleton = null;
        attemptReconnect();
      });

      function attemptReconnect() {
        if (reconnectAttempts < maxReconnectAttempts) {
          const reconnectDelay = initialReconnectInterval * Math.pow(2, reconnectAttempts);
          console.log(`Attempting to reconnect in ${reconnectDelay} ms. Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
          setTimeout(createAndInitializeWebSocket, reconnectDelay);
          reconnectAttempts++;
        } else {
          console.error('Max reconnect attempts reached. Giving up.');
          isCreatingWebSocket = false;
          reject(new Error('Max reconnect attempts reached'));
        }
      }
    };

    createAndInitializeWebSocket();
  });
}

// 示例调用
async function sendMessageToServer(message) {
  const socket = await getWebSocket();
  socket.send(message);
  try {
    const json = JSON.parse(message);
    if (json && json.p) {
      const p = json.p;
      const c = p.c;
      const data = p.p;
      if (!c && !data) return;
      const action = dispatch(c, data);
      // if (action) {
      //     session.sendMessage(new TextMessage(JSON.stringify(action)));
      // }
      // return;
    }
  } catch (e) {
    console.error('Error parsing message:', e);
  }
}

function dispatch(action, data) {
  switch (action) {
    case "pushGameStatus":
      const A = data.A;
      if (A) {
        for (let i = 0; i < A.length; i++) {
          const obj = A[i];
          const tableId = obj.AA;
          const num = obj.BB;
          const roundId = obj.CC;
          const status = obj.DD;
          // return bjService.pushGameStatus(tableId, num, roundId, status);
        }
      }
      break;
    case "getCountDown":
      const C = data.C;
      for (let i = 0; i < C.length; i++) {
        const o = C[i];
        // bjService.getBjRound(o.AA, o.BB);
      }
      break;
    case "pushRawCards":
      const roundId = data.E;
      const tableId = data.A;
      const B = data.B;

      if (!B || B.length < 2) {
        return null;
      }

      const bankCard = B[0].filter(card => card > 0);

      const playCards = [];
      for (let i = 1; i < B.length; i++) {
        const playCard = B[i].filter(card => card > 0);
        if (playCard.length > 0) {
          playCards.push(playCard);
        }
      }

      // bjService.updateCards(tableId, roundId, bankCard, playCards);
      break;

    // ... 其他 case 分支

    default:
      // console.log("-- %s %o", action, data);
  }
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
    return;
  }
  chrome.debugger.attach({
    tabId: tab.id
  }, '1.3', () => {
    chrome.debugger.sendCommand({
      tabId: tab.id
    }, 'Network.enable');

    attachedTabs.set(tab.id, true);

    // 使用闭包保存 tab.id
    const onDebuggerEvent = (source, method, params) => {
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
        if (opcode === 1) {
          sendMessageToServer(payloadData);
        }
      }
    };

    // 移除之前的事件监听器
    chrome.debugger.onEvent.removeListener(onDebuggerEvent);
    chrome.debugger.onEvent.addListener(onDebuggerEvent);
    injectWebSocketTracker(tab.id);
  });
}

// 给所有 websocket 发送服务端传来的消息
function sendServerMessageToWebSocket(data) {
  // 如果 data 是 json 字符串，我需要解析，然后发送，否则直接发送
  let action;
  try {
    action = JSON.parse(data);
    handleAction(action);
    return;
  } catch (e) {
    // 如果解析失败，直接使用原始 data
  }

  attachedTabs.forEach((value, tabId) => {
    chrome.debugger.sendCommand({ tabId: tabId }, 'Runtime.evaluate', {
      expression: data,
      returnByValue: true,
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('发送消息时执行脚本报错：');
        console.error(JSON.stringify(chrome.runtime.lastError, null, 2));
      } else {
        console.log('消息发送成功:' + JSON.stringify(results));
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
      if (window) {
        console.log("window :" + window);
        // window.Netbet.component.baseGameHall.sexyHall();
      }
      console.log("message:" + message);
      (function() { eval(message); })();
    }
    // 暴露方法供外部调用
    window.handleMessage = handleMessage;
    console.log('WebSocket tracker injected successfully.');
  })();
  `;

  chrome.debugger.sendCommand({ tabId: tabId }, 'Runtime.evaluate', {
    expression: script,
    returnByValue: true
  }, function (result) {
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

/**
 * 替换脚本模板中的占位符
 * @param {string} template - 脚本模板
 * @param {Object|Array} args - 参数对象或数组
 * @returns {string} - 替换后的脚本
 */
function replacePlaceholders(template, args) {
  // 替换 %0%, %1%, 等
  template = template.replace(/\%(\d+)\%/g, (match, index) => {
    return JSON.stringify(args[index] || match);
  });

  // 替换 %abc%, %xyz%, 等
  template = template.replace(/\%(\w+)\%/g, (match, placeholder) => {
    return JSON.stringify(args[placeholder] || match);
  });

  return template;
}

function handleAction(action) {
  var command = action.command;
  switch (command) {
    case "startRound":
      // 获取参数
      break;
    case "finishRound":
      // 获取参数
      break;
    case "doNothing":
      break;
    case "bet":
      var odds = action.odds;
      break;
    case "hit":
      break;
    case "double":
      break;
    case "split":
      break;
    case "stand":
      break;
    default:
      console.log("未知命令：" + command);
  }
}
