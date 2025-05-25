// index.js
import * as echarts from '../../ec-canvas/echarts';

// 导入真实数据
const hotListData = require('../../data/hot_list.json');
const chartData = require('../../data/chart_data.json');
const updateInfo = require('../../data/update_info.json');

let chart = null;

// 初始化图表
function initChart(canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

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
    hotList: hotListData,
    updateInfo: updateInfo,
    lastUpdateTime: updateInfo.last_update || '未知'
  },
  
  onLoad() {
    // 页面加载时的逻辑
    console.log('热榜数据加载完成，共', this.data.hotList.length, '条数据');
    console.log('最后更新时间:', this.data.lastUpdateTime);
  },
  
  // 刷新数据
  onRefresh() {
    wx.showToast({
      title: '数据已是最新',
      icon: 'success',
      duration: 1000
    });
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
