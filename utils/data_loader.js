/**
 * 热梗数据加载器
 * 用于加载和处理应用中的JSON数据
 */

const dataConverter = require('./data_converter');

// 创建数据管理器实例
const dataManager = dataConverter.createDataManager();

// 预加载的JS模块数据
const hotListModule = require('../data/hot_list');
const chartDataModule = require('../data/chart_data');
const updateInfoModule = require('../data/update_info');

/**
 * 初始化所有数据
 * @returns {Promise<void>}
 */
async function initAllData() {
  try {
    // 加载热榜数据
    await dataManager.load('hotList', {
      moduleData: hotListModule,
      autoSaveToStorage: 'cache_hotList'
    });

    // 加载图表数据
    await dataManager.load('chartData', {
      moduleData: chartDataModule,
      autoSaveToStorage: 'cache_chartData'
    });

    // 加载更新信息
    await dataManager.load('updateInfo', {
      moduleData: updateInfoModule,
      autoSaveToStorage: 'cache_updateInfo'
    });

    console.log('所有数据初始化完成');
  } catch (error) {
    console.error('数据初始化失败:', error);
  }
}

/**
 * 从网络加载最新数据
 * @param {string} apiUrl - API地址
 * @returns {Promise<Object>} - 加载结果
 */
async function loadLatestData(apiUrl) {
  try {
    // 从网络加载最新数据
    const latestData = await dataConverter.loadJsonFromNetwork(apiUrl);
    
    // 更新本地数据
    if (latestData.hotList) {
      await dataManager.save('hotList', latestData.hotList, {
        storage: 'cache_hotList'
      });
    }
    
    if (latestData.chartData) {
      await dataManager.save('chartData', latestData.chartData, {
        storage: 'cache_chartData'
      });
    }
    
    if (latestData.updateInfo) {
      await dataManager.save('updateInfo', latestData.updateInfo, {
        storage: 'cache_updateInfo'
      });
    }
    
    return {
      success: true,
      data: latestData
    };
  } catch (error) {
    console.error('加载最新数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取热榜数据
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Array} - 热榜数据
 */
function getHotList(forceRefresh = false) {
  // 如果需要强制刷新，先清除缓存
  if (forceRefresh) {
    dataManager.clear('hotList');
  }
  
  // 返回数据，如果没有缓存会返回null
  return dataManager.get('hotList') || [];
}

/**
 * 获取图表数据
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Object} - 图表数据
 */
function getChartData(forceRefresh = false) {
  if (forceRefresh) {
    dataManager.clear('chartData');
  }
  return dataManager.get('chartData') || { dates: [], series: [] };
}

/**
 * 获取更新信息
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Object} - 更新信息
 */
function getUpdateInfo(forceRefresh = false) {
  if (forceRefresh) {
    dataManager.clear('updateInfo');
  }
  return dataManager.get('updateInfo') || { last_update: '未知' };
}

/**
 * 将JSON数据保存到用户文件系统
 * @param {string} fileName - 文件名
 * @param {Object} data - 要保存的数据
 * @returns {Promise<boolean>} - 保存是否成功
 */
async function exportDataToFile(fileName, data) {
  try {
    return await dataConverter.saveJsonToFile(fileName, data);
  } catch (error) {
    console.error('导出数据失败:', error);
    return false;
  }
}

module.exports = {
  initAllData,
  loadLatestData,
  getHotList,
  getChartData,
  getUpdateInfo,
  exportDataToFile
}; 