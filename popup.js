console.log('popup runtime.id:', chrome.runtime.id);
console.log('popup baseURL:', chrome.runtime.getURL(''));
console.log('popup questions.json URL:', chrome.runtime.getURL('questions.json'));


let questions = [];

// 加载题库
fetch(chrome.runtime.getURL("questions.json"))
  .then(res => res.json())
  .then(data => {
    questions = data;
  })
  .catch(err => {
    console.warn("加载 questions.json 失败", err);
    questions = [];
  });

// 点击搜索
document.getElementById("search").addEventListener("click", () => {
  const input = document.getElementById("question").value.trim();
  if (!input) return;

  const result = findBestMatch(input);
  const resultBox = document.getElementById("result");
  if (result) {
    resultBox.innerText = "✅ " + result.answer;
  } else {
    resultBox.innerText = "❌ 未找到匹配答案";
  }
});

// 回车触发
document.getElementById("question").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("search").click();
  }
});

// 模糊匹配（和 content.js 保持一致）
function findBestMatch(input) {
  let best = null;
  let maxScore = 0;

  console.log("questions:", questions);
  questions.forEach(q => {
    const score = similarity(q.question, input);
    console.log("pop分词结果",score)
    if (score > maxScore) {
      maxScore = score;
      best = q;
    }
  });

  return maxScore > 0.3 ? best : null;
}

function similarity(a, b) {
  let same = 0;
  for (let char of a) {
    if (b.includes(char)) same++;
  }
  return same / Math.max(a.length, b.length);
}