(function(){
let tableNameElements = document.querySelectorAll('.tableName');

tableNameElements.forEach(tableName => {
    if (tableName.textContent.includes('BJ501')) {
        simulateClick(tableName);
        console.log("entering bj501 table...")
    }
});

function simulateClick(element) {
     const clickEvent = new MouseEvent('click', {
         bubbles: true,
         cancelable: true,
         view: window
     });
     element.dispatchEvent(clickEvent);
 }

console.log('enterTable BJ501.');

})();