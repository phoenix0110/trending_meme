# 网络梗数据采集器

## 功能特点

- **智能梗检测**: 使用OpenAI GPT模型智能判断话题是否为网络梗
- **多平台采集**: 支持微博、B站、知乎等平台的热门话题采集
- **缓存机制**: 避免重复调用LLM API，提高效率
- **容错机制**: LLM不可用时自动输出所有热点话题

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置说明

### 方法1: 使用环境变量

创建 `.env` 文件：

```env
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# 梗检测配置
MAX_MEME_LENGTH=20
ENABLE_LLM_MEME_DETECTION=true

# 数据采集配置
MAX_TOPICS_PER_SOURCE=30
REQUEST_TIMEOUT=10
```

### 方法2: 直接传入API密钥

```python
from collectors import MemeCollector

# 直接传入OpenAI API密钥
collector = MemeCollector(openai_api_key="your_api_key_here")
```

## 使用示例

```python
from collectors import MemeCollector

# 创建采集器实例
collector = MemeCollector()

# 运行所有采集器
memes_data = collector.run_all_collectors()

# 查看采集结果
print(f"总共采集到 {len(memes_data)} 个梗")
for meme in memes_data:
    print(f"- {meme['name']} (来源: {meme['source']})")
```

## 梗的定义标准

根据LLM判断，网络梗应该满足以下特征：

1. **趣味性**: 具有幽默性和娱乐性
2. **传播性**: 在网络上广泛传播
3. **理解性**: 大部分网民都能理解其含义
4. **表达性**: 经常用于表达情绪或观点
5. **文化性**: 具有一定的文化内涵或背景故事

## 非梗内容

以下类型的内容不会被识别为梗：
- 纯粹的新闻事件（如"地震"、"事故"等）
- 严肃的政治话题
- 单纯的人名或地名
- 技术术语或专业词汇

## 容错机制

当LLM不可用或判断失败时，系统会：
- 直接输出所有采集到的热点话题
- 确保数据采集的完整性，不会因为LLM问题而丢失热点数据
- 在日志中明确标记LLM失败的情况 