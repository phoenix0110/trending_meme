import pandas as pd
from datetime import datetime, timedelta
import re
import jieba
import jieba.analyse
from openai import OpenAI
from config import Config

class MemeProcessor:
    def __init__(self, raw_data):
        self.raw_data = raw_data
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        self.processed_data = None
        self.previous_data = None
        
        # 初始化OpenAI客户端用于生成解释
        self.openai_client = None
        if Config.is_llm_enabled():
            self.openai_client = OpenAI(
                api_key=Config.get_openai_api_key(),
                base_url=Config.get_openai_base_url()
            )
            print("✅ 已启用LLM梗解释生成功能")
        else:
            print("⚠️  LLM不可用，将使用简化的解释生成")
        
        # 缓存解释结果，避免重复调用
        self.explanation_cache = {}
    
    def load_previous_data(self, file_path="meme_data_history.csv"):
        """加载昨天的数据用于计算环比变化"""
        try:
            df = pd.read_csv(file_path)
            self.previous_data = df[df['更新日期'] == self.yesterday]
            return len(self.previous_data)
        except Exception as e:
            print(f"加载历史数据失败: {e}")
            self.previous_data = pd.DataFrame(columns=['更新日期', '梗的名称', '热度', '梗的简单解释', '梗的来源', '环比昨天热度变化'])
            return 0
    
    def standardize_heat_value(self, heat_str):
        """将不同格式的热度值标准化为数值"""
        if isinstance(heat_str, (int, float)):
            return float(heat_str)
            
        # 移除所有非数字、小数点和单位字符
        heat_str = str(heat_str)
        num_str = re.sub(r'[^0-9.]', '', heat_str)
        
        try:
            num_value = float(num_str)
            
            # 根据单位调整值
            if '万' in heat_str or 'w' in heat_str.lower():
                num_value *= 10000
            elif '亿' in heat_str:
                num_value *= 100000000
                
            return num_value
        except:
            return 0
    
    def generate_meme_explanation(self, meme_name):
        """使用大模型生成梗的简单解释"""
        # 检查缓存
        if meme_name in self.explanation_cache:
            return self.explanation_cache[meme_name]
        
        # 如果没有OpenAI客户端，使用简化版本
        if not self.openai_client:
            keywords = jieba.analyse.extract_tags(meme_name, topK=2)
            if keywords:
                explanation = f"与{'、'.join(keywords)}相关的网络流行语"
            else:
                explanation = "当下流行的网络热梗"
            self.explanation_cache[meme_name] = explanation
            return explanation
        
        try:
            # 构建prompt
            prompt = f"""
请为网络梗"{meme_name}"生成一个简洁的解释（不超过20个字）。

要求：
1. 解释要通俗易懂，让不了解这个梗的人能快速理解
2. 说明这个梗的含义、用法或来源
3. 语言要简洁，控制在20字以内
4. 不要包含"网络梗"、"流行语"等词汇

只返回解释内容，不要其他说明。
"""
            
            response = self.openai_client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "你是一个专门解释网络梗的助手，能够用简洁的语言解释各种网络流行语的含义。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.5
            )
            
            explanation = response.choices[0].message.content.strip()
            
            # 缓存结果
            self.explanation_cache[meme_name] = explanation
            return explanation
            
        except Exception as e:
            print(f"LLM生成解释失败 ('{meme_name}'): {e}")
            # 调用失败时使用备用方案
            keywords = jieba.analyse.extract_tags(meme_name, topK=2)
            if keywords:
                explanation = f"与{'、'.join(keywords)}相关的网络流行语"
            else:
                explanation = "当下流行的网络热梗"
            self.explanation_cache[meme_name] = explanation
            return explanation
    
    def calculate_heat_change(self, meme_name, current_heat):
        """计算环比昨天的热度变化"""
        if self.previous_data is None or self.previous_data.empty:
            return 0
        
        # 查找昨天的数据
        yesterday_data = self.previous_data[self.previous_data['梗的名称'] == meme_name]
        
        if yesterday_data.empty:
            return 100  # 新出现的梗，设为100%增长
        
        yesterday_heat = yesterday_data.iloc[0]['热度']
        
        if yesterday_heat == 0:
            return 100
            
        change_rate = ((current_heat - yesterday_heat) / yesterday_heat) * 100
        return round(change_rate, 1)  # 保留一位小数
    
    def process_data(self):
        """处理原始数据为标准格式"""
        # 转换为DataFrame
        df = pd.DataFrame(self.raw_data)
        
        # 数据去重
        df = df.drop_duplicates(subset=['name'])
        
        # 标准化热度值
        df['heat_value'] = df['heat'].apply(self.standardize_heat_value)
        
        # 按热度排序并取TOP20
        df = df.sort_values(by='heat_value', ascending=False).head(20)
        
        # 生成标准格式数据
        result_data = []
        for _, row in df.iterrows():
            meme_name = row['name']
            heat_value = row['heat_value']
            meme_source = row['source']  # 获取梗的来源
            
            # 使用大模型生成解释
            explanation = self.generate_meme_explanation(meme_name)
            
            # 计算热度变化
            heat_change = self.calculate_heat_change(meme_name, heat_value)
            
            # 添加到结果
            result_data.append({
                '更新日期': self.today,
                '梗的名称': meme_name,
                '热度': heat_value,
                '梗的简单解释': explanation,
                '梗的来源': meme_source,
                '环比昨天热度变化': heat_change
            })
        
        self.processed_data = pd.DataFrame(result_data)
        return self.processed_data