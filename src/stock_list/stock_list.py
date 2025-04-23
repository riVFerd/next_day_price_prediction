import json
from typing import Optional

class StockInfo:
    def __init__(self, stock_code: str, stock_name: str):
        self.stock_code = stock_code
        self.stock_name = stock_name

    def __repr__(self):
        return f"StockInfo(stock_code={self.stock_code}, stock_name={self.stock_name})"


def get_stock_list() -> Optional[list[StockInfo]]:
    try:
        with open("src/stock_list/stock_list.json", "r") as f:
            stock_list = json.load(f)
            return [StockInfo(stock["Code"], stock["Name"]) for stock in stock_list]
    except FileNotFoundError as e:
        print(f"Error: {e}")
        pass
