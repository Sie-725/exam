import XLSX from 'xlsx';

/**
 * Excel 转 JSON 转换脚本
 * 读取 网络维护.xlsx，生成 questions.json
 * 
 * 结构：
 * - B列：题目
 * - C列：答案（单选：A-H，多选：A,B,C,D...）
 * - H-O列：选项（共8列）
 * - 跳过第一行（标题）
 * 
 * 功能：
 * - 自动将答案字母转换为对应的选项文本
 * - 支持多选题（多个答案用逗号/分号/空格分隔）
 */

const workbook = XLSX.readFile('网络维护.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 转换为 JSON（按单元格地址）
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log(`总共 ${jsonData.length} 行数据`);

// 跳过第一行，从第二行开始
const questions = [];

for (let i = 1; i < jsonData.length; i++) {
  const row = jsonData[i];
  
  // 获取题目 (B列，索引1)
  const question = row[1] || '';
  
  // 获取答案 (C列，索引2)
  const answerRaw = row[2] || '';
  
  // 获取选项 (H-O列，索引7-14)
  const options = [];
  for (let j = 7; j <= 14; j++) {
    const option = row[j];
    if (option && option.toString().trim()) {
      options.push(option.toString().trim());
    }
  }
  
  // 只处理有题目的行
  if (question.toString().trim()) {
    let finalAnswer = answerRaw.toString().trim();
    
    // 处理答案：可能是单个字母或多选题（多个字母用逗号/分号/空格分隔）
    // 支持的格式：A,B,C | A;B;C | A B C | ABC
    if (finalAnswer) {
      // 先尝试按常见分隔符分割
      let letters = [];
      
      // 处理逗号分隔： A,B,C
      if (finalAnswer.includes(',')) {
        letters = finalAnswer.split(',').map(s => s.trim().toUpperCase());
      }
      // 处理分号分隔： A;B;C
      else if (finalAnswer.includes(';')) {
        letters = finalAnswer.split(';').map(s => s.trim().toUpperCase());
      }
      // 处理空格分隔： A B C
      else if (finalAnswer.includes(' ')) {
        letters = finalAnswer.split(' ').map(s => s.trim().toUpperCase()).filter(s => s);
      }
      // 处理连续字母（无分隔符）： ABC
      else if (/^[A-Ha-h]+$/.test(finalAnswer)) {
        letters = finalAnswer.toUpperCase().split('').filter(s => s >= 'A' && s <= 'H');
      }
      // 单个字母
      else {
        letters = [finalAnswer.toUpperCase()];
      }
      
      // 将字母转换为对应的选项文本
      const answerTexts = [];
      for (const letter of letters) {
        if (letter >= 'A' && letter <= 'H') {
          const index = letter.charCodeAt(0) - 'A'.charCodeAt(0);
          if (options[index]) {
            answerTexts.push(options[index]);
          }
        }
      }
      
      // 如果成功转换，使用转换后的文本
      if (answerTexts.length > 0) {
        finalAnswer = answerTexts.join('；');
      }
    }
    
    questions.push({
      question: question.toString().trim(),
      answer: finalAnswer,
      options: options
    });
  }
}

console.log(`转换完成，共 ${questions.length} 道题目`);

// 找到刚才那道多选题验证
const multiChoice = questions.find(q => q.question.includes('电源及机房环境监控系统'));
if (multiChoice) {
  console.log('\n=== 多选题验证 ===');
  console.log(`题目: ${multiChoice.question}`);
  console.log(`答案: ${multiChoice.answer}`);
  console.log(`选项: ${multiChoice.options.join(' | ')}`);
}

// 输出前3条预览
console.log('\n=== 预览前3条 ===');
questions.slice(0, 3).forEach((q, i) => {
  console.log(`\n${i + 1}. 题目: ${q.question}`);
  console.log(`   答案: ${q.answer}`);
  console.log(`   选项: ${q.options.join(' | ')}`);
});

// 保存到 questions.json
const fs = await import('fs');
fs.writeFileSync('questions.json', JSON.stringify(questions, null, 2), 'utf-8');
console.log('\n✅ 已保存到 questions.json');
