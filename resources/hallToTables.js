(function(){
document.querySelectorAll('[data-name="BLACKJACK"]').forEach(ele => {ele.dispatchEvent(new MouseEvent('click', {bubbles: true,cancelable: true,view: window}))})
})();
