chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.type === 'websocket') {
      console.log('details.url:', details.url);
      console.log('details.type:', details.type);
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

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


  chrome.debugger.attach({ tabId: tab.id }, '1.3', () => {
     if (attachedTabs.has(tab.id)) {
        console.log(`Debugger already attached to tab ${tab.id}. Skipping.`);
    }else{
        chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.enable');
    }
    attachedTabs.set(tab.id, true);
    chrome.debugger.onEvent.addListener((source, method, params) => {
     // console.log(`debugger on event ${source}  ${method}  ${params}`);
      if (method === 'Network.webSocketFrameReceived' && source.tabId === tab.id) {
        const { requestId, timestamp, response } = params;
        const { opcode, mask, payloadData } = response;

        console.log('WebSocket frame received:',params);
         let payloadDisplay;
          if (opcode === 1 && !mask) {
            // 二进制帧或者无掩码，直接输出原始 base64 数据
            payloadDisplay = payloadData;
          } else {
            // 其他情况（文本帧或有掩码的帧），尝试解码为文本
            try {
              const decodedPayload = atob(payloadData);
              payloadDisplay = decodedPayload;
            } catch (error) {
              payloadDisplay = `Failed to decode payload: ${error.message}`;
            }
          }
          console.log(">>",payloadDisplay);
      }
    });
  });
}

// 查询当前窗口的所有非隐藏标签页并尝试启用WebSocket调试功能
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  for (const tab of tabs) {
    if (!isInternalURL(tab.url)) {
       console.log('enable debugging for tab ',tab);

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
