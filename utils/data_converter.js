/**
 * 微信小程序数据转换工具
 * 用于处理JSON数据并转换为可用的JavaScript对象
 */

/**
 * 从本地存储中获取JSON数据并转换为JS对象
 * @param {string} key - 存储数据的键名
 * @param {Object} defaultValue - 默认值，当数据不存在时返回
 * @returns {Object} - 转换后的JavaScript对象
 */
function getDataFromStorage(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(key);
    if (data) {
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (e) {
    console.error(`获取数据失败: ${e.message}`);
    return defaultValue;
  }
}

/**
 * 将JavaScript对象保存到本地存储
 * @param {string} key - 存储数据的键名
 * @param {Object} data - 要存储的数据对象
 * @returns {boolean} - 保存是否成功
 */
function saveDataToStorage(key, data) {
  try {
    wx.setStorageSync(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`保存数据失败: ${e.message}`);
    return false;
  }
}

/**
 * 从本地文件系统读取JSON文件并转换为JS对象
 * 注意：微信小程序只能读取用户空间内的文件
 * @param {string} filePath - 文件路径（相对于用户空间）
 * @returns {Promise<Object>} - 转换后的JavaScript对象
 */
function loadJsonFromFile(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    
    // 确保文件路径包含用户空间前缀
    const fullPath = filePath.startsWith(wx.env.USER_DATA_PATH) 
      ? filePath 
      : `${wx.env.USER_DATA_PATH}/${filePath}`;
    
    fs.readFile({
      filePath: fullPath,
      encoding: 'utf8',
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve(data);
        } catch (e) {
          reject(new Error(`解析JSON失败: ${e.message}`));
        }
      },
      fail: (err) => {
        reject(new Error(`读取文件失败: ${err.errMsg}`));
      }
    });
  });
}

/**
 * 将JSON数据保存到本地文件系统
 * @param {string} filePath - 文件路径（相对于用户空间）
 * @param {Object} data - 要保存的数据对象
 * @returns {Promise<boolean>} - 保存是否成功
 */
function saveJsonToFile(filePath, data) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    
    // 确保文件路径包含用户空间前缀
    const fullPath = filePath.startsWith(wx.env.USER_DATA_PATH) 
      ? filePath 
      : `${wx.env.USER_DATA_PATH}/${filePath}`;
    
    // 将数据转换为JSON字符串
    const jsonString = JSON.stringify(data, null, 2);
    
    fs.writeFile({
      filePath: fullPath,
      data: jsonString,
      encoding: 'utf8',
      success: () => {
        resolve(true);
      },
      fail: (err) => {
        reject(new Error(`保存文件失败: ${err.errMsg}`));
      }
    });
  });
}

/**
 * 从网络加载JSON数据
 * @param {string} url - 数据URL
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} - 加载的数据对象
 */
function loadJsonFromNetwork(url, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header || { 'content-type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(`网络请求失败: ${err.errMsg}`));
      }
    });
  });
}

/**
 * 创建一个数据管理器，用于管理多个数据源
 * @returns {Object} - 数据管理器对象
 */
function createDataManager() {
  const cachedData = {};
  
  return {
    /**
     * 加载数据，支持多种数据源
     * @param {string} key - 数据键名
     * @param {Object} options - 加载选项
     * @returns {Promise<Object>} - 加载的数据
     */
    async load(key, options = {}) {
      // 如果数据已缓存且不强制刷新，直接返回缓存数据
      if (cachedData[key] && !options.forceRefresh) {
        return cachedData[key];
      }
      
      try {
        let data;
        
        // 根据不同的数据源类型加载数据
        if (options.storage) {
          // 从本地存储加载
          data = getDataFromStorage(options.storage, options.defaultValue);
        } else if (options.filePath) {
          // 从文件系统加载
          data = await loadJsonFromFile(options.filePath);
        } else if (options.url) {
          // 从网络加载
          data = await loadJsonFromNetwork(options.url, options.requestOptions);
        } else if (options.moduleData) {
          // 直接使用模块数据
          data = options.moduleData;
        } else {
          throw new Error('未指定数据源');
        }
        
        // 缓存数据
        cachedData[key] = data;
        
        // 如果指定了自动保存到本地存储，则保存
        if (options.autoSaveToStorage) {
          saveDataToStorage(options.autoSaveToStorage, data);
        }
        
        return data;
      } catch (error) {
        console.error(`加载数据[${key}]失败:`, error);
        return options.defaultValue || null;
      }
    },
    
    /**
     * 保存数据
     * @param {string} key - 数据键名
     * @param {Object} data - 要保存的数据
     * @param {Object} options - 保存选项
     * @returns {Promise<boolean>} - 保存是否成功
     */
    async save(key, data, options = {}) {
      try {
        // 更新缓存
        cachedData[key] = data;
        
        // 根据不同的目标类型保存数据
        if (options.storage) {
          // 保存到本地存储
          return saveDataToStorage(options.storage, data);
        } else if (options.filePath) {
          // 保存到文件系统
          return await saveJsonToFile(options.filePath, data);
        }
        
        return true;
      } catch (error) {
        console.error(`保存数据[${key}]失败:`, error);
        return false;
      }
    },
    
    /**
     * 获取已缓存的数据
     * @param {string} key - 数据键名
     * @returns {Object} - 缓存的数据或null
     */
    get(key) {
      return cachedData[key] || null;
    },
    
    /**
     * 清除缓存的数据
     * @param {string} key - 可选，指定要清除的数据键名，不指定则清除所有
     */
    clear(key) {
      if (key) {
        delete cachedData[key];
      } else {
        Object.keys(cachedData).forEach(k => delete cachedData[k]);
      }
    }
  };
}

module.exports = {
  getDataFromStorage,
  saveDataToStorage,
  loadJsonFromFile,
  saveJsonToFile,
  loadJsonFromNetwork,
  createDataManager
}; 