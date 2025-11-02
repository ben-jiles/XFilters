// content/content.js
let rules = [];

// Load rules
chrome.storage.sync.get(['rules'], data => {
  rules = data.rules || [];
  scanTweets(); // Initial scan
});

// Listen for rule updates
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RULES_UPDATED') {
    rules = msg.rules;
    scanTweets();
  }
});

// Helper: Quiet hours
function isInQuietHours(now, start, end) {
  if (!start || !end) return true;
  return now >= new Date(start) && now <= new Date(end);
}

// Compile active rules
function compileActiveRules() {
  return rules
    .filter(r => r.enabled && r.regex)
    .map(r => {
      try {
        return {
          re: new RegExp(r.regex, 'gi'),
          timeStart: r.timeStart,
          timeEnd: r.timeEnd,
          user: r.user ? r.user.toLowerCase().replace(/^@/, '') : null,
          action: r.action || 'hide'
        };
      } catch (e) { return null; }
    })
    .filter(Boolean);
}

// Main scan function — runs on every change
function scanTweets() {
  const activeRules = compileActiveRules();
  if (!activeRules.length) return;

  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  const now = new Date();

  tweets.forEach(tweet => {
    // Skip if already fully processed
    if (tweet.dataset.xfiltered === 'done') return;

    const textEl = tweet.querySelector('[data-testid="tweetText"]');
    if (!textEl) return;

    const text = textEl.innerText;
    const userEl = tweet.querySelector('a[role="link"][href*="/"] span');
    const username = userEl ? userEl.innerText.toLowerCase().replace(/^@/, '') : null;

    let matchedRule = null;

    for (const rule of activeRules) {
      const matches = [
        rule.re.test(text),
        !rule.user || username === rule.user,
        !rule.timeStart || !rule.timeEnd || isInQuietHours(now, rule.timeStart, rule.timeEnd)
      ];
      if (matches.every(Boolean)) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      tweet.dataset.xfiltered = 'done';
      return;
    }

    // === APPLY ACTION ===
    // Reset
    tweet.style.cssText = '';
    tweet.classList.remove('xfiltered-blur', 'xfiltered-highlight');
    textEl.innerHTML = text;

    if (matchedRule.action === 'hide') {
      tweet.style.display = 'none';
    } 
    else if (matchedRule.action === 'blur') {
      const blurred = text.replace(matchedRule.re, '<span class="xblur">$&</span>');
      textEl.innerHTML = blurred;
      tweet.classList.add('xfiltered-blur');
    } 
    else if (matchedRule.action === 'highlight') {
      const highlighted = text.replace(matchedRule.re, '<u>$&</u>');
      textEl.innerHTML = highlighted;
      tweet.classList.add('xfiltered-highlight');
    }

    // Mark as done — but re-check on hover/click
    tweet.dataset.xfiltered = 'done';
  });
}

// === RE-APPLY ON EVERY DOM CHANGE ===
// X.com aggressively re-renders tweets
const observer = new MutationObserver(() => {
  // Reset all processed flags so we re-apply
  document.querySelectorAll('article[data-testid="tweet"]').forEach(t => {
    if (t.dataset.xfiltered === 'done') {
      delete t.dataset.xfiltered; // Force re-process
    }
  });
  setTimeout(scanTweets, 50);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-testid']
});

// Initial scan + periodic fallback
setTimeout(scanTweets, 500);
setInterval(scanTweets, 2000);
