// 数据加载模块，用于小程序加载最新的热梗数据

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * 读取最新的热梗数据
 * @returns {Promise<Array>} 热梗数据数组
 */
function loadLatestMemeData() {
  return new Promise((resolve, reject) => {
    const dataDir = path.join(__dirname, '..', 'data');
    
    // 获取所有CSV文件
    const files = fs.readdirSync(dataDir).filter(file => 
      file.startsWith('meme_data_') && file.endsWith('.csv')
    );
    
    // 按日期排序，获取最新的文件
    files.sort().reverse();
    
    if (files.length === 0) {
      reject(new Error('没有找到热梗数据文件'));
      return;
    }
    
    const latestFile = path.join(dataDir, files[0]);
    const results = [];
    
    fs.createReadStream(latestFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // 转换数据格式以适应小程序
        const formattedData = results.map(item => ({
          name: item['梗的名称'],
          desc: item['梗的简单解释'],
          heat: formatHeatValue(item['热度']),
          trend: parseFloat(item['环比昨天热度变化'])
        }));
        
        resolve(formattedData);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * 格式化热度值为友好显示
 * @param {number} value 原始热度值
 * @returns {string} 格式化后的热度值
 */
function formatHeatValue(value) {
  const num = parseFloat(value);
  
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else {
    return num.toFixed(0);
  }
}

module.exports = {
  loadLatestMemeData
};