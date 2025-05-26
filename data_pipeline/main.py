from collectors import MemeCollector
from processor import MemeProcessor
from storage import MemeStorage
from data_converter import DataConverter
from config import Config
import os
import logging
from datetime import datetime
import argparse

def setup_directories():
    """创建必要的目录"""
    # 创建输出基础目录
    if not os.path.exists(Config.OUTPUT_BASE_DIR):
        os.makedirs(Config.OUTPUT_BASE_DIR)
    
    # 创建日志目录
    if not os.path.exists(Config.LOG_DIR):
        os.makedirs(Config.LOG_DIR)
    
    # 创建数据目录
    if not os.path.exists(Config.DATA_DIR):
        os.makedirs(Config.DATA_DIR)

def setup_logging():
    """设置日志配置"""
    setup_directories()
    
    log_filename = os.path.join(Config.LOG_DIR, f"pipeline_{datetime.now().strftime('%Y%m%d')}.log")
    logging.basicConfig(
        filename=log_filename,
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 同时输出到控制台
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    
    logger = logging.getLogger('meme_pipeline')
    logger.addHandler(console_handler)
    
    return logger

def run_pipeline(output_dir=None):
    """运行完整的数据管道"""
    logger = setup_logging()
    
    try:
        logger.info("开始运行数据管道")
        
        # 使用传入的output_dir参数或配置中的默认路径
        data_dir = output_dir if output_dir else Config.DATA_DIR
        logger.info(f"数据将保存到: {data_dir}")
        
        # 确保数据目录存在
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        # 1. 数据采集
        logger.info("开始数据采集")
        collector = MemeCollector()
        raw_data = collector.run_all_collectors()
        logger.info(f"数据采集完成，共获取 {len(raw_data)} 条原始数据")
        
        # 2. 数据处理
        logger.info("开始数据处理")
        processor = MemeProcessor(raw_data)
        processor.load_previous_data()
        processed_data = processor.process_data()
        logger.info(f"数据处理完成，共处理 {len(processed_data)} 条数据")
        
        # 3. 数据存储
        logger.info("开始数据存储")
        storage = MemeStorage(processed_data, data_dir=data_dir)
        daily_save_result = storage.save_to_csv()
        history_update_result = storage.update_history_file()
        
        if daily_save_result and history_update_result:
            logger.info("数据存储完成")
            
            # 4. 数据转换为小程序JS模块
            logger.info("开始转换数据为小程序JS模块")
            converter = DataConverter()
            js_convert_result = converter.convert_and_save_js()
            
            if js_convert_result:
                logger.info("JS模块转换成功")
                logger.info("数据管道运行成功")
                logger.info(f"所有文件已保存到: {Config.OUTPUT_BASE_DIR} 目录")
                logger.info("小程序数据文件已更新到: ../data 目录")
                return True
            else:
                logger.warning("JS模块转换失败，但数据管道主要流程已完成")
                return True
        else:
            logger.error("数据存储过程出现错误")
            return False
            
    except Exception as e:
        logger.error(f"数据管道运行失败: {e}")
        return False

def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='热梗数据管道')
    parser.add_argument('--output-dir', type=str, help='输出目录（可选，默认使用config中的配置）')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    success = run_pipeline(output_dir=args.output_dir)
    
    if success:
        print("data collector success")
    else:
        print("data collector failed")