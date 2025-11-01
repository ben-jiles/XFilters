const $=s=>document.querySelector(s);const enable=$('#enable'),regex=$('#regex'),save=$('#save'),status=$('#status'),msg=$('#msg');
function show(t,e=false){msg.textContent=t;msg.style.color=e?'#d32f2f':'#2e7d32';setTimeout(()=>msg.textContent='',3000);}
chrome.storage.sync.get(['enabled','regex'],d=>{enable.checked=!!d.enabled;regex.value=d.regex||'';status.textContent=enable.checked?'Enabled':'Disabled';});
enable.addEventListener('change',()=>status.textContent=enable.checked?'Enabled':'Disabled');
save.addEventListener('click',()=>{const r=regex.value.trim(),e=enable.checked;if(e&&r){try{new RegExp(r,'i');}catch(ex){show('Invalid regex',true);return;}}chrome.storage.sync.set({enabled:e,regex:r},()=>{chrome.tabs.query({active:true,currentWindow:true},tabs=>{chrome.tabs.sendMessage(tabs[0].id,{type:'RULE_UPDATE',enabled:e,regex:r});});show('Saved & applied');});});
