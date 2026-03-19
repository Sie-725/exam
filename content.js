console.log('content runtime.id:', chrome.runtime.id);
console.log('content baseURL:', chrome.runtime.getURL(''));
console.log('content questions.json URL:', chrome.runtime.getURL('questions.json'));

// 加载工具模块
const Utils = window.ExamHelperUtils;

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

// 初始化：加载题库
Utils.loadQuestions();

// 快捷键消息处理
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "search") return;

  (async () => {
    await Utils.getQuestionsReady();

    let raw = window.getSelection().toString() || "";
    const normalized = Utils.normalizeText(raw);

    if (!normalized) {
      showResult("⚠️ 请先选中题目");
      return;
    }

    try {
      const result = Utils.findBestMatch(normalized);
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
