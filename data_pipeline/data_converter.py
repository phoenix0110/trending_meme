#!/usr/bin/env python3
"""
数据转换器：将CSV数据转换为小程序可用的JSON格式
"""

import pandas as pd
import json
import os
from datetime import datetime, timedelta
from config import Config

class DataConverter:
    def __init__(self):
        self.data_dir = Config.DATA_DIR
        self.output_dir = "../data"  # 小程序的data目录
        
        # 确保输出目录存在
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def load_latest_data(self):
        """加载最新的数据"""
        try:
            # 读取历史数据文件
            history_file = os.path.join(self.data_dir, "meme_data_history.csv")
            df = pd.read_csv(history_file)
            
            print(f"✅ 成功加载 {len(df)} 条历史记录")
            return df
            
        except Exception as e:
            print(f"❌ 加载数据失败: {e}")
            return None
    
    def generate_hot_list(self, df):
        """生成热榜数据"""
        try:
            # 获取最新日期的数据
            latest_date = df['更新日期'].max()
            latest_data = df[df['更新日期'] == latest_date].copy()
            
            # 按热度排序
            latest_data = latest_data.sort_values('热度', ascending=False)
            
            hot_list = []
            for _, row in latest_data.head(10).iterrows():  # 取前10个
                hot_list.append({
                    'name': row['梗的名称'],
                    'desc': row['梗的简单解释'],
                    'heat': self.format_heat(row['热度']),
                    'trend': int(row['环比昨天热度变化']) if pd.notna(row['环比昨天热度变化']) else 0,
                    'source': row['梗的来源'] if '梗的来源' in row else '未知'
                })
            
            print(f"✅ 生成热榜数据 {len(hot_list)} 条")
            return hot_list
            
        except Exception as e:
            print(f"❌ 生成热榜数据失败: {e}")
            return []
    
    def generate_chart_data(self, df):
        """生成图表数据"""
        try:
            # 获取最近7天的数据
            recent_dates = df['更新日期'].unique()
            recent_dates = sorted(recent_dates)[-7:]  # 最近7天
            
            # 选择热度最高的3个梗进行趋势分析
            top_memes = df.groupby('梗的名称')['热度'].max().sort_values(ascending=False).head(3).index.tolist()
            
            # 生成日期标签
            date_labels = []
            for date in recent_dates:
                try:
                    date_obj = datetime.strptime(date, '%Y-%m-%d')
                    date_labels.append(date_obj.strftime('%m月%d日'))
                except:
                    date_labels.append(date)
            
            # 生成系列数据
            series_data = []
            colors = ['#1890ff', '#ff4d4f', '#52c41a']
            
            for i, meme in enumerate(top_memes):
                meme_data = []
                for date in recent_dates:
                    day_data = df[(df['更新日期'] == date) & (df['梗的名称'] == meme)]
                    if not day_data.empty:
                        # 将热度值标准化到0-100范围
                        heat = day_data.iloc[0]['热度']
                        normalized_heat = min(100, max(0, heat / 10000))  # 简单的标准化
                        meme_data.append(round(normalized_heat, 1))
                    else:
                        # 如果某天没有数据，用前一天的数据或者0
                        meme_data.append(meme_data[-1] if meme_data else 0)
                
                series_data.append({
                    'name': meme,
                    'type': 'line',
                    'smooth': True,
                    'data': meme_data,
                    'symbol': 'circle',
                    'symbolSize': 8,
                    'emphasis': {
                        'itemStyle': {
                            'borderWidth': 3
                        }
                    },
                    'endLabel': {
                        'show': True,
                        'formatter': '{a}',
                        'distance': 8,
                        'color': colors[i] if i < len(colors) else '#1890ff',
                        'fontSize': 14
                    }
                })
            
            chart_data = {
                'dates': date_labels,
                'series': series_data
            }
            
            print(f"✅ 生成图表数据，包含 {len(series_data)} 个系列")
            return chart_data
            
        except Exception as e:
            print(f"❌ 生成图表数据失败: {e}")
            return {'dates': [], 'series': []}
    
    def format_heat(self, heat_value):
        """格式化热度值"""
        try:
            heat = float(heat_value)
            if heat >= 100000:
                return f"{heat/10000:.1f}w"
            elif heat >= 10000:
                return f"{heat/10000:.1f}w"
            elif heat >= 1000:
                return f"{heat/1000:.1f}k"
            else:
                return str(int(heat))
        except:
            return "0"
    
    def convert_and_save(self):
        """转换数据并保存为JSON"""
        print("开始数据转换...")
        
        # 加载数据
        df = self.load_latest_data()
        if df is None:
            print("❌ 无法加载数据，使用默认数据")
            return False
        
        # 生成热榜数据
        hot_list = self.generate_hot_list(df)
        
        # 生成图表数据
        chart_data = self.generate_chart_data(df)
        
        # 保存数据
        try:
            # 保存热榜数据
            hot_list_file = os.path.join(self.output_dir, "hot_list.json")
            with open(hot_list_file, 'w', encoding='utf-8') as f:
                json.dump(hot_list, f, ensure_ascii=False, indent=2)
            
            # 保存图表数据
            chart_data_file = os.path.join(self.output_dir, "chart_data.json")
            with open(chart_data_file, 'w', encoding='utf-8') as f:
                json.dump(chart_data, f, ensure_ascii=False, indent=2)
            
            # 保存更新时间
            update_info = {
                'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'data_count': len(df),
                'latest_date': df['更新日期'].max() if not df.empty else 'N/A'
            }
            
            update_file = os.path.join(self.output_dir, "update_info.json")
            with open(update_file, 'w', encoding='utf-8') as f:
                json.dump(update_info, f, ensure_ascii=False, indent=2)
            
            print(f"✅ 数据转换完成！")
            print(f"   热榜数据: {hot_list_file}")
            print(f"   图表数据: {chart_data_file}")
            print(f"   更新信息: {update_file}")
            
            return True
            
        except Exception as e:
            print(f"❌ 保存数据失败: {e}")
            return False

def main():
    """主函数"""
    converter = DataConverter()
    success = converter.convert_and_save()
    
    if success:
        print("\n🎉 数据转换成功！现在可以在小程序中使用真实数据了。")
    else:
        print("\n❌ 数据转换失败！")

if __name__ == "__main__":
    main() 