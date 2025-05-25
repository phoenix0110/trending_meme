import requests
from bs4 import BeautifulSoup
from datetime import datetime
from openai import OpenAI
from config import Config

class MemeCollector:
    def __init__(self, openai_api_key=None):
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.memes_data = []
        
        # 初始化OpenAI客户端
        self.openai_client = None
        api_key = openai_api_key or Config.get_openai_api_key()
        
        if api_key:
            self.openai_client = OpenAI(
                api_key=api_key,
                base_url=Config.get_openai_base_url()
            )
            print("✅ 已启用LLM梗检测功能")
        else:
            print("⚠️  未找到OpenAI API密钥，将使用备用判断逻辑")
        
        # 缓存LLM判断结果，避免重复调用
        self.meme_cache = {}
    
    def collect_weibo_hot_topics(self):
        """从微博热搜采集热门话题"""
        try:
            url = "https://weibo.com/ajax/side/hotSearch"
            response = requests.get(url, headers=self.headers)
            data = response.json()
            
            if data and 'data' in data and 'realtime' in data['data']:
                hot_topics = data['data']['realtime']
                for topic in hot_topics[:Config.MAX_TOPICS_PER_SOURCE]:  # 获取热搜
                    if self._is_meme(topic['word']):
                        self.memes_data.append({
                            'name': topic['word'],
                            'heat': topic['num'],
                            'source': '微博热搜'
                        })
            return len(self.memes_data)
        except Exception as e:
            print(f"微博热搜采集错误: {e}")
            return 0
    
    def collect_bilibili_hot_topics(self):
        """从B站热门话题采集"""
        try:
            url = f"https://api.bilibili.com/x/web-interface/search/square?limit={Config.BILIBILI_API_LIMIT}"
            response = requests.get(url, headers=self.headers)
            data = response.json()
            
            if data and data['code'] == 0 and 'data' in data:
                trending = data['data']['trending']
                for topic in trending['list']:
                    if self._is_meme(topic['keyword']):
                        self.memes_data.append({
                            'name': topic['keyword'],
                            'heat': topic['heat_score'],
                            'source': 'B站热搜'
                        })
            return len(self.memes_data)
        except Exception as e:
            print(f"B站热搜采集错误: {e}")
            return 0
    
    def _is_meme(self, text):
        """使用大模型判断一个话题是否为网络梗"""
        # 检查缓存
        if text in self.meme_cache:
            return self.meme_cache[text]
        
        # 如果没有OpenAI客户端，直接返回True（输出所有热点）
        if not self.openai_client:
            print(f"LLM不可用，直接输出热点: '{text}'")
            self.meme_cache[text] = True
            return True
        
        try:
            # 构建prompt
            prompt = f"""
请判断以下文本是否是一个"网络梗"。

网络梗的定义：普罗大众都知道的一个有趣的事件、短语、表达方式或者流行语，通常具有幽默性、娱乐性，在网络上广泛传播并被大家理解和使用。

网络梗的特征：
1. 具有趣味性和娱乐性
2. 在网络上广泛传播
3. 大部分网民都能理解其含义
4. 经常用于表达情绪或观点
5. 具有一定的文化内涵或背景故事

不是网络梗的例子：
- 纯粹的新闻事件（如"地震"、"事故"等）
- 严肃的政治话题
- 单纯的人名或地名
- 技术术语或专业词汇

待判断文本："{text}"

请只回答"是"或"否"，不要解释。
"""
            
            response = self.openai_client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "你是识别网络梗的助手，能够准确判断一个词语或短语是否为网络梗。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=Config.OPENAI_MAX_TOKENS,
                temperature=Config.OPENAI_TEMPERATURE
            )
            
            result = response.choices[0].message.content.strip()
            is_meme = result == "是"
            
            # 缓存结果
            self.meme_cache[text] = is_meme
            return is_meme
            
        except Exception as e:
            print(f"LLM判断梗失败 ('{text}'): {e}，直接输出热点")
            # 调用失败时直接返回True（输出所有热点）
            self.meme_cache[text] = True
            return True
    
    def run_all_collectors(self):
        """运行所有采集器"""
        self.collect_weibo_hot_topics()
        self.collect_bilibili_hot_topics()
        
        # 返回采集到的数据
        return self.memes_data