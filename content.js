(function() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof WebSocket) {
            console.log('Detected WebSocket object:', node);

            node.addEventListener('message', (event) => {
              console.log('WebSocket received message:', event.data);
            });

            node.addEventListener('close', () => {
              console.log('WebSocket closed');
            });
          }
        });
      }
    });
  });

  observer.observe(document, { childList: true, subtree: true, attributes: false, characterData: false });

 console.log("web socket monitor content.js is loaded.")
})();