(function(){
    async function selectCoin(n){
        selectAllCoin();
        var dataSrc = 'chip' + (n * 100) + '_mousein';
        var chipDivs = document.querySelectorAll('.chip[data-src="' + dataSrc + '"]');
        chipDivs.forEach(function(chipDiv) {
            chipDiv.click();
        });
        if (chipDivs.length === 0) {
            var found = false;
            document.querySelectorAll('.chipAmount .value').forEach(function(valueElement) {
                console.log("custom chip value :"+valueElement.textContent);
                if (parseInt(valueElement.textContent.trim(), 10) === n) {
                    found = true;
                    console.log("custom chip value found :"+valueElement.textContent);
                    valueElement.closest('.chipWrap').querySelector('.chip').click();
                }
            });
            if (!found ) {
                addCoin(n);
                await delay(2000);
                document.querySelectorAll('.chipAmount .value').forEach(function(valueElement) {
                    console.log("custom chip value :"+valueElement.textContent);
                    if (parseInt(valueElement.textContent.trim(), 10) === n) {
                        found = true;
                        console.log("custom chip value found :"+valueElement.textContent);
                        valueElement.closest('.chipWrap').querySelector('.chip').click();
                    }
                });
            }
        }
    }
   function delay(ms) {return new Promise(resolve => setTimeout(resolve, ms));}

   async function selectAllCoin(){
        document.getElementById('customChipsBtn_normal').click();
        document.querySelectorAll('.chipsContainer').forEach(function(chipsContainer) {
          if (!chipsContainer.classList.contains('selected')) {
                chipsContainer.click();
            }
        });
       document.getElementById('confirmBtn_normal').click();
       await delay(100)
       document.getElementById('confirmBtn_hover').click();
    }

   async function addCoin(n){
        if (localStorage.playerTableCustomChip) {
            var data = JSON.parse(localStorage.getItem('playerTableCustomChip'));
            console.log("custom chips:"+JSON.stringify(data));
        	var modified = false;
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const chip = data[key];
                    if (chip.isSelected === true && parseInt(chip.value) === parseInt(n) * 100) {
                        return;
                    } else if (chip.isSelected === false) {
                        chip.value = n * 100;
                        chip.isSelected = true;
                        modified = true;
                        break;
                    }
                }
            }
            if (!modified) {
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        data[key].value = n * 100;
                        data[key].isSelected = true;
                        break;
                    }
                }
            }
            localStorage.setItem('playerTableCustomChip', JSON.stringify(data));
        }else{
             localStorage.setItem('playerTableCustomChip', JSON.stringify({
                chip1: { value: n*100 , isSelected: true },
                chip2: { value: '', isSelected: false },
                chip3: { value: '', isSelected: false },
                chip4: { value: '', isSelected: false }
            }));
        }
        selectAllCoin();
    }
    selectCoin(125);
})();