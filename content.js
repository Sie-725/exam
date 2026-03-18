console.log('content runtime.id:', chrome.runtime.id);
console.log('content baseURL:', chrome.runtime.getURL(''));
console.log('content questions.json URL:', chrome.runtime.getURL('questions.json'));

// 全局显示悬浮框（确保在任何调用之前可用）
function showResult(text) {
  function createBox() {
    let box = document.getElementById('exam-helper-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'exam-helper-box';
      Object.assign(box.style, {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 2147483647,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '6px',
        maxWidth: '420px',
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'none',
        whiteSpace: 'pre-wrap'
      });
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(box), { once: true });
      } else {
        document.body.appendChild(box);
      }
    }
    return box;
  }

  const doShow = () => {
    const box = createBox();
    box.textContent = text;
    box.style.display = 'block';
    if (window.__examHelperHideTimer) clearTimeout(window.__examHelperHideTimer);
    window.__examHelperHideTimer = setTimeout(() => {
      box.style.display = 'none';
    }, 6000);
  };

  if (!document.body) {
    document.addEventListener('DOMContentLoaded', () => doShow(), { once: true });
  } else {
    doShow();
  }
}

// 题库加载（并保存 Promise）
const url = chrome.runtime.getURL('questions.json');
console.log('==========Fetching from:', url);
let questions = [];
let questionsReady = fetch(url)
  .then(res => {
    console.log('Fetch response status:', res.status);
    return res.json();
  })
  .then(data => {
    questions = data;
    console.log('Questions loaded, count:', data.length);
  })
  .catch(err => {
    console.error('Fetch failed:', err, 'URL was:', url);
    questions = [];
  });

// 简单字符相似度（与 popup 保持一致）
function similarity(a, b) {
  if (!a || !b) return 0;
  let same = 0;
  for (let char of a) {
    if (b.includes(char)) same++;
  }
  return same / Math.max(a.length, b.length);
}

function findBestMatch(input) {
  let best = null;
  let maxScore = 0;
  for (const q of questions) {
    const score = similarity(q.question || "", input);
    if (score > maxScore) {
      maxScore = score;
      best = q;
    }
  }
  return maxScore > 0.3 ? best : null;
}

// 快捷键消息处理（不依赖分词/jiaba）
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "search") return;
  (async () => {
    await questionsReady;

    let raw = window.getSelection().toString() || "";
    const normalized = raw
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // 去除零宽字符
      .replace(/\s+/g, " ")                  // 合并空白
      .trim();

    if (!normalized) {
      showResult("⚠️ 请先选中题目");
      return;
    }

    try {
      const result = findBestMatch(normalized);
      console.log('content.js 匹配结果 ->', result);
      if (result) showResult("✅ " + result.answer);
      else showResult("❌ 未找到匹配答案");
    } catch (e) {
      console.error('search error:', e);
      showResult('❌ 查询出错');
    }
  })();
  return true;
});