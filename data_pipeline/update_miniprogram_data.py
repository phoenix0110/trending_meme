#!/usr/bin/env python3
"""
自动更新小程序数据脚本
在数据采集完成后自动转换并更新小程序数据
"""

import subprocess
import sys
import os
from datetime import datetime

def run_data_pipeline():
    """运行数据采集管道"""
    print("🚀 开始运行数据采集管道...")
    
    try:
        # 运行main.py进行数据采集
        result = subprocess.run([sys.executable, 'main.py'], 
                              capture_output=True, text=True, check=True)
        
        print("✅ 数据采集完成")
        if result.stdout:
            print("输出:", result.stdout)
        
        return True
        
    except subprocess.CalledProcessError as e:
        print("❌ 数据采集失败:")
        print("错误:", e.stderr)
        return False

def convert_data_for_miniprogram():
    """转换数据为小程序格式"""
    print("🔄 开始转换数据为小程序格式...")
    
    try:
        # 运行data_converter.py进行数据转换
        result = subprocess.run([sys.executable, 'data_converter.py'], 
                              capture_output=True, text=True, check=True)
        
        print("✅ 数据转换完成")
        if result.stdout:
            print("输出:", result.stdout)
        
        return True
        
    except subprocess.CalledProcessError as e:
        print("❌ 数据转换失败:")
        print("错误:", e.stderr)
        return False

def update_complete_notification():
    """更新完成通知"""
    print("\n" + "="*50)
    print("🎉 小程序数据更新完成！")
    print(f"⏰ 更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("📱 现在可以在小程序中查看最新的热梗数据了")
    print("="*50)

def main():
    """主函数"""
    print("🔥 开始更新小程序数据...")
    print(f"📅 当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    # 步骤1: 运行数据采集
    if not run_data_pipeline():
        print("❌ 数据更新失败：数据采集步骤失败")
        return False
    
    print("-" * 30)
    
    # 步骤2: 转换数据格式
    if not convert_data_for_miniprogram():
        print("❌ 数据更新失败：数据转换步骤失败")
        return False
    
    # 步骤3: 完成通知
    update_complete_notification()
    
    return True

if __name__ == "__main__":
    success = main()
    
    if not success:
        print("\n❌ 小程序数据更新失败！")
        sys.exit(1)
    else:
        print("\n✅ 小程序数据更新成功！") 