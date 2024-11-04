(function(){
var popupLayer = document.getElementById('popupLayer');
if (popupLayer && window.getComputedStyle(popupLayer).display !== 'none') {
    var confirmButton = popupLayer.querySelector('.confirm');
    if (confirmButton) {
        confirmButton.click();
        console.log('Clicked the confirm button');
    } else {
        console.log('No confirm button found');
    }
}
 })();