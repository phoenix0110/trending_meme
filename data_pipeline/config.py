class Config:
    """配置管理类"""
    
    # OpenAI API配置
    OPENAI_API_KEY = "sk-il1PeieWZQ3sMwq2nsp4rGOZmvpm5y6eyY9Y7Fx668zEY6KU"  # 请替换为你的实际API密钥
    OPENAI_MODEL = "gpt-4o"
    OPENAI_BASE_URL = "https://api.chatanywhere.tech/v1"
    OPENAI_MAX_TOKENS = 10
    OPENAI_TEMPERATURE = 0.1
    
    # 梗检测配置
    MAX_MEME_LENGTH = 20
    ENABLE_LLM_MEME_DETECTION = True
    
    # 数据采集配置
    MAX_TOPICS_PER_SOURCE = 30
    REQUEST_TIMEOUT = 10
    BILIBILI_API_LIMIT = 10
    
    # 路径配置（相对路径）
    OUTPUT_BASE_DIR = "collector_output"
    LOG_DIR = "collector_output/logs"
    DATA_DIR = "collector_output/data"
    
    @classmethod
    def get_openai_api_key(cls):
        """获取OpenAI API密钥"""
        return cls.OPENAI_API_KEY
    
    @classmethod
    def get_openai_base_url(cls):
        """获取OpenAI API base URL"""
        return cls.OPENAI_BASE_URL
    
    @classmethod
    def is_llm_enabled(cls):
        """检查是否启用LLM梗检测"""
        return cls.ENABLE_LLM_MEME_DETECTION and cls.OPENAI_API_KEY != "your_openai_api_key_here" 