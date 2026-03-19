/**
 * Exam Helper - 通用工具模块
 */

// 题库数据
let questions = [];
let questionsReady = null;

/**
 * 计算两个字符串的字符相似度
 * @param {string} a - 字符串A
 * @param {string} b - 字符串B
 * @returns {number} - 相似度分数 (0-1)
 */
function similarity(a, b) {
  if (!a || !b) return 0;
  let same = 0;
  for (let char of a) {
    if (b.includes(char)) same++;
  }
  return same / Math.max(a.length, b.length);
}

/**
 * 在题库中查找所有匹配结果
 * @param {string} input - 输入的查询文本
 * @param {number} threshold - 相似度阈值 (默认0.3)
 * @param {number} limit - 返回数量限制 (默认10)
 * @returns {Array} - 匹配的题目对象数组
 */
function findAllMatches(input, threshold = 0.3, limit = 10) {
  const results = [];

  for (const q of questions) {
    const score = similarity(q.question || "", input);
    if (score > threshold) {
      results.push({
        question: q,
        score: score
      });
    }
  }

  // 按相似度降序排列
  results.sort((a, b) => b.score - a.score);

  // 返回指定数量的结果
  return results.slice(0, limit).map(r => r.question);
}

/**
 * 在题库中查找最佳匹配的题目
 * @param {string} input - 输入的查询文本
 * @returns {object|null} - 匹配的题目对象或null
 */
function findBestMatch(input) {
  const matches = findAllMatches(input, 0.3, 1);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * 在题目中查找关键词后面4个字符
 * @param {string} question - 题目文本
 * @param {string} keyword - 搜索关键词
 * @returns {string} - 关键词后面的4个字符
 */
function getKeywordAfterChars(question, keyword) {
  if (!question || !keyword) return '';
  
  const index = question.indexOf(keyword);
  if (index === -1) return '';
  
  // 获取关键词后面的4个字符
  const afterChars = question.slice(index + keyword.length, index + keyword.length + 4);
  
  // 如果不够4个字符，返回实际存在的字符
  return afterChars;
}

/**
 * 加载题库数据
 * @returns {Promise} - 题库加载完成Promise
 */
function loadQuestions() {
  if (questionsReady) {
    return questionsReady;
  }

  const url = chrome.runtime.getURL('questions.json');
  console.log('==========Fetching from:', url);

  questionsReady = fetch(url)
    .then(res => {
      console.log('Fetch response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      questions = data;
      console.log('Questions loaded, count:', data.length);
      return questions;
    })
    .catch(err => {
      console.error('Fetch failed:', err, 'URL was:', url);
      questions = [];
      throw err;
    });

  return questionsReady;
}

/**
 * 获取已加载的题库
 * @returns {Array} - 题库数组
 */
function getQuestions() {
  return questions;
}

/**
 * 获取题库加载Promise
 * @returns {Promise|null} - 题库加载Promise
 */
function getQuestionsReady() {
  return questionsReady;
}

/**
 * 规范化文本（去除零宽字符、合并空白）
 * @param {string} text - 原始文本
 * @returns {string} - 规范化后的文本
 */
function normalizeText(text) {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 导出公共API
if (typeof window !== 'undefined') {
  window.ExamHelperUtils = {
    similarity,
    findBestMatch,
    findAllMatches,
    getKeywordAfterChars,
    loadQuestions,
    getQuestions,
    getQuestionsReady,
    normalizeText
  };
}
