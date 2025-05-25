// index.js
import * as echarts from '../../ec-canvas/echarts';
import dataLoader from '../../utils/data_loader';

let chart = null;

// 初始化图表
function initChart(canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  // 获取图表数据
  const chartData = dataLoader.getChartData();

  const option = {
    color: ['#1890ff', '#ff4d4f', '#52c41a'],
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValueLabel + '\n';
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value}\n`;
        });
        return result;
      },
      confine: true // 确保提示框在画布内
    },
    grid: {
      left: '3%',
      right: '15%', // 增加右侧空间用于显示热梗名称
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.dates,
      axisPointer: {
        show: true
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      },
      axisPointer: {
        snap: true
      }
    },
    dataZoom: [{
      type: 'inside',
      start: 0,
      end: 100,
      filterMode: 'filter'
    }, {
      type: 'slider',
      start: 0,
      end: 100,
      height: 20,
      bottom: 0,
      filterMode: 'filter'
    }],
    series: chartData.series
  };

  chart.setOption(option);
  
  // 添加点击事件监听
  chart.on('click', function(params) {
    wx.showToast({
      title: `${params.seriesName}: ${params.value}`,
      icon: 'none',
      duration: 2000
    });
  });
  
  return chart;
}

Page({
  data: {
    ec: {
      onInit: initChart
    },
    hotList: [],
    updateInfo: {},
    lastUpdateTime: '未知'
  },
  
  async onLoad() {
    try {
      // 初始化数据
      await dataLoader.initAllData();
      
      // 更新页面数据
      this.setData({
        hotList: dataLoader.getHotList(),
        updateInfo: dataLoader.getUpdateInfo(),
        lastUpdateTime: dataLoader.getUpdateInfo().last_update || '未知'
      });
      
      console.log('热榜数据加载完成，共', this.data.hotList.length, '条数据');
      console.log('最后更新时间:', this.data.lastUpdateTime);
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },
  
  // 刷新数据
  async onRefresh() {
    wx.showLoading({
      title: '刷新中...'
    });
    
    try {
      // 这里模拟网络刷新，实际项目中应该调用API
      // 例如：const result = await dataLoader.loadLatestData('https://api.example.com/data');
      
      // 模拟刷新操作
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '数据已是最新',
          icon: 'success',
          duration: 1000
        });
      }, 500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    }
  },
  
  // 查看梗详情
  onTapMeme(e) {
    const meme = e.currentTarget.dataset.meme;
    wx.showModal({
      title: meme.name,
      content: `${meme.desc}\n\n热度: ${meme.heat}\n来源: ${meme.source}\n趋势: ${meme.trend > 0 ? '+' : ''}${meme.trend}%`,
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
