console.log('popup runtime.id:', chrome.runtime.id);
console.log('popup baseURL:', chrome.runtime.getURL(''));
console.log('popup questions.json URL:', chrome.runtime.getURL('questions.json'));

// 加载工具模块
const Utils = window.ExamHelperUtils;

// 加载题库
Utils.loadQuestions().catch(err => {
  console.warn("加载 questions.json 失败", err);
});

// 点击搜索
document.getElementById("search").addEventListener("click", () => {
  const input = document.getElementById("question").value.trim();
  if (!input) return;

  // 查找所有匹配结果
  const results = Utils.findAllMatches(input, 0.25, 10);
  const resultBox = document.getElementById("result");

  if (results.length === 0) {
    resultBox.innerHTML = '<div style="color: #e53935; padding: 10px;">❌ 未找到匹配答案</div>';
    return;
  }

  // 生成多个结果列表
  let html = `<div style="color: #666; font-size: 12px; margin-bottom: 10px;">找到 ${results.length} 个匹配结果：</div>`;

  results.forEach((item, index) => {
    // 获取关键词后面的4个字符
    const afterChars = Utils.getKeywordAfterChars(item.question, input);

    // 截取题目显示（保留关键词前后部分）
    let questionDisplay = item.question;
    const keywordIndex = item.question.indexOf(input);
    if (keywordIndex !== -1) {
      // 显示关键词前面50个字符 + 关键词 + 后面30个字符
      const before = Math.max(0, keywordIndex - 50);
      const after = Math.min(item.question.length, keywordIndex + input.length + 30);
      questionDisplay = (before > 0 ? '...' : '') +
                        item.question.slice(before, keywordIndex) +
                        '<b style="color: #e53935; background: #ffebee; padding: 0 2px;">' + input + '</b>' +
                        item.question.slice(keywordIndex + input.length, after) +
                        (after < item.question.length ? '...' : '');
    }

    // 高亮答案中的关键词后面4个字符
    let answerDisplay = item.answer;
    if (afterChars && item.answer.includes(afterChars)) {
      answerDisplay = item.answer.replace(
        afterChars,
        '<b style="color: #e53935; background: #ffebee; padding: 0 2px;">' + afterChars + '</b>'
      );
    }

    html += `
      <div style="margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 6px; border-left: 3px solid #2196F3;">
        <div style="color: #999; font-size: 11px; margin-bottom: 4px;">#${index + 1}</div>
        <div style="color: #333; font-size: 12px; line-height: 1.5; margin-bottom: 6px;">${questionDisplay}</div>
        <div style="color: #2196F3; font-size: 13px; font-weight: bold;">
          答案：${answerDisplay}
        </div>
      </div>
    `;
  });

  resultBox.innerHTML = html;
});

// 回车触发
document.getElementById("question").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("search").click();
  }
});
