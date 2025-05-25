/**
 * 数据处理工具 - 将JSON文件转换为JS模块
 * 
 * 使用方法:
 * 1. 将JSON文件放入data目录
 * 2. 运行此脚本: node data_pipeline.js
 * 3. 对应的JS模块将被自动创建
 */

const fs = require('fs');
const path = require('path');

// 配置项
const CONFIG = {
  // 数据目录（相对于脚本的路径）
  dataDir: '../data',
  // 是否启用监视模式，自动监控文件变化
  watchMode: true,
  // 日志输出
  verbose: true
};

// 日志函数
function log(message) {
  if (CONFIG.verbose) {
    console.log(`[Data Pipeline] ${message}`);
  }
}

// 获取数据目录的绝对路径
const DATA_DIR = path.resolve(__dirname, CONFIG.dataDir);

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  log(`创建数据目录: ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 将JSON文件转换为JS模块
 * @param {string} jsonFilePath - JSON文件路径
 * @returns {boolean} - 转换是否成功
 */
function convertJsonToJsModule(jsonFilePath) {
  try {
    // 读取JSON文件内容
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    // 解析JSON以验证格式是否正确
    const jsonData = JSON.parse(jsonContent);
    
    // 创建JS模块文件路径
    const jsFilePath = jsonFilePath.replace('.json', '.js');
    
    // 生成模块导出代码
    const jsContent = `module.exports = ${JSON.stringify(jsonData, null, 2)};`;
    
    // 写入JS文件
    fs.writeFileSync(jsFilePath, jsContent, 'utf8');
    
    log(`已转换: ${path.basename(jsonFilePath)} → ${path.basename(jsFilePath)}`);
    return true;
  } catch (error) {
    log(`转换失败: ${path.basename(jsonFilePath)}`);
    log(`错误: ${error.message}`);
    return false;
  }
}

/**
 * 处理数据目录中的所有JSON文件
 */
function processAllJsonFiles() {
  log('开始处理所有JSON文件...');
  
  // 获取数据目录中的所有文件
  const files = fs.readdirSync(DATA_DIR);
  
  // 筛选出JSON文件
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  log(`发现 ${jsonFiles.length} 个JSON文件`);
  
  // 转换所有JSON文件
  let successCount = 0;
  for (const jsonFile of jsonFiles) {
    const jsonFilePath = path.join(DATA_DIR, jsonFile);
    if (convertJsonToJsModule(jsonFilePath)) {
      successCount++;
    }
  }
  
  log(`成功转换 ${successCount}/${jsonFiles.length} 个文件`);
}

/**
 * 启动文件监视模式
 */
function startWatchMode() {
  log(`启动监视模式，监控目录: ${DATA_DIR}`);
  
  fs.watch(DATA_DIR, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
      log(`检测到文件变化: ${filename}, 事件: ${eventType}`);
      
      // 如果是更改事件，转换该文件
      const jsonFilePath = path.join(DATA_DIR, filename);
      if (fs.existsSync(jsonFilePath)) {
        convertJsonToJsModule(jsonFilePath);
      }
    }
  });
  
  log('监视模式已启动，按 Ctrl+C 退出');
}

// 主函数
function main() {
  log('数据处理工具启动');
  
  // 处理所有现有的JSON文件
  processAllJsonFiles();
  
  // 如果启用了监视模式，启动文件监视
  if (CONFIG.watchMode) {
    startWatchMode();
  }
}

// 执行主函数
main(); 