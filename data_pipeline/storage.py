import pandas as pd
import os
from datetime import datetime

class MemeStorage:
    def __init__(self, data=None, data_dir=None):
        self.data = data
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_dir = data_dir if data_dir else os.path.join(self.base_dir, 'data')
        
        # 确保数据目录存在
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def save_to_csv(self, filename=None):
        """保存数据到CSV文件"""
        if self.data is None or self.data.empty:
            print("没有数据可保存")
            return False
        
        if filename is None:
            filename = f"meme_data_{self.today}.csv"
        
        file_path = os.path.join(self.data_dir, filename)
        
        try:
            self.data.to_csv(file_path, index=False, encoding='utf-8-sig')
            print(f"数据已保存到 {file_path}")
            return True
        except Exception as e:
            print(f"保存数据失败: {e}")
            return False
    
    def update_history_file(self):
        """更新历史数据文件"""
        history_file = os.path.join(self.data_dir, "meme_data_history.csv")
        
        try:
            # 如果历史文件存在，则加载并追加新数据
            if os.path.exists(history_file):
                history_data = pd.read_csv(history_file)
                
                # 删除今天已有的数据（如果有）
                history_data = history_data[history_data['更新日期'] != self.today]
                
                # 合并新数据
                combined_data = pd.concat([history_data, self.data])
            else:
                combined_data = self.data
            
            # 保存更新后的历史数据
            combined_data.to_csv(history_file, index=False, encoding='utf-8-sig')
            print(f"历史数据已更新到 {history_file}")
            return True
        except Exception as e:
            print(f"更新历史数据失败: {e}")
            return False