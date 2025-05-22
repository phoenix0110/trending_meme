// index.js
import * as echarts from '../../ec-canvas/echarts';

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
      formatter: '{b}\n{a0}: {c0}\n{a1}: {c1}\n{a2}: {c2}',
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
      data: ['1月1日', '1月8日', '1月15日', '1月22日', '1月29日', '2月5日', '2月12日', '2月19日', '2月26日'],
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
    series: [
      {
        name: '打工人',
        type: 'line',
        smooth: true,
        data: [100, 95, 90, 85, 88, 92, 90, 85, 80],
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          itemStyle: {
            borderWidth: 3
          }
        },
        endLabel: {
          show: true,
          formatter: '{a}',
          distance: 8,
          color: '#1890ff',
          fontSize: 14
        }
      },
      {
        name: '内卷',
        type: 'line',
        smooth: true,
        data: [90, 85, 75, 70, 75, 80, 75, 70, 65],
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          itemStyle: {
            borderWidth: 3
          }
        },
        endLabel: {
          show: true,
          formatter: '{a}',
          distance: 8,
          color: '#ff4d4f',
          fontSize: 14
        }
      },
      {
        name: '躺平',
        type: 'line',
        smooth: true,
        data: [80, 75, 70, 60, 55, 60, 65, 60, 55],
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          itemStyle: {
            borderWidth: 3
          }
        },
        endLabel: {
          show: true,
          formatter: '{a}',
          distance: 8,
          color: '#52c41a',
          fontSize: 14
        }
      }
    ]
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
    hotList: [
      { name: '打工人', desc: '形容现代社会中努力工作的人们', heat: '10.2w', trend: 5 },
      { name: '内卷', desc: '比喻过度竞争导致的恶性循环', heat: '9.8w', trend: 3 },
      { name: '躺平', desc: '放弃竞争，追求最低限度的生活', heat: '9.5w', trend: -2 },
      { name: '绝绝子', desc: '表达惊讶、震惊的情绪', heat: '8.7w', trend: 1 },
      { name: '破防了', desc: '情绪被触动，心理防线被攻破', heat: '8.2w', trend: -1 },
      { name: '啊这', desc: '表示尴尬或无语的情况', heat: '7.9w', trend: -3 },
      { name: '整活', desc: '搞笑或恶作剧行为', heat: '7.5w', trend: 2 },
      { name: '摸鱼', desc: '工作时间做与工作无关的事', heat: '7.2w', trend: 0 },
      { name: '奥利给', desc: '表示加油、鼓励的口号', heat: '6.8w', trend: -5 },
      { name: '柠檬精', desc: '形容酸溜溜、嫉妒的心态', heat: '6.5w', trend: -2 }
    ]
  },
  onLoad() {
    // 页面加载时的逻辑
  }
});
