let enabled = false, regexSource = '';
chrome.storage.sync.get(['enabled','regex'], d=>{(enabled=!!d.enabled);(regexSource=d.regex||'');if(enabled&&regexSource)start();});
function getRegex(){try{return new RegExp(regexSource,'i');}catch(e){return null;}}
function filter(){if(!enabled)return;const re=getRegex();if(!re)return;document.querySelectorAll('article[data-testid="tweet"]').forEach(t=>{if(t.dataset.xp)return;const txt=t.innerText.toLowerCase();if(re.test(txt))t.style.display='none';t.dataset.xp='1';});}
function start(){filter();new MutationObserver(filter).observe(document.body,{childList:true,subtree:true});}
chrome.runtime.onMessage.addListener(m=>{if(m.type==='RULE_UPDATE'){enabled=!!m.enabled;regexSource=m.regex||'';document.querySelectorAll('article[data-testid="tweet"]').forEach(t=>delete t.dataset.xp);if(enabled&&regexSource)start();else document.querySelectorAll('article[data-testid="tweet"]').forEach(t=>t.style.display='');}});
