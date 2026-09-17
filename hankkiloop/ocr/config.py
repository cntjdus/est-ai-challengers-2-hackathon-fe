import os
from pathlib import Path
from dotenv import load_dotenv
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env', override=False, encoding='utf-8-sig')

class Settings:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY', '').strip()
        self.model = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash').strip()
        self.daily_limit = int(os.getenv('OCR_DAILY_LIMIT', '50'))
        if not 1 <= self.daily_limit <= 10000:
            raise ValueError('OCR_DAILY_LIMIT은 1~10000 정수로 설정해주세요.')
        self.usage_path = ROOT / '.local' / 'usage.sqlite3'
    @property
    def configured(self):
        return bool(self.api_key and self.api_key not in {'YOUR_API_KEY','여기에_API_키'})
