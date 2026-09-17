import io
import warnings
import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 20_000_000


def load_crop(data, roi):
    if len(data) > MAX_BYTES:
        raise ValueError('사진은 10MB 이하로 선택해주세요.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as im:
                if im.format not in {'JPEG', 'PNG', 'WEBP'}:
                    raise ValueError('JPEG, PNG, WebP 사진을 사용해주세요. HEIC는 JPG로 변환해주세요.')
                if im.width * im.height > MAX_PIXELS:
                    raise ValueError('사진은 2,000만 화소 이하로 줄여주세요.')
                im = ImageOps.exif_transpose(im).convert('RGB')
                w, h = im.size
                x, y, rw, rh = roi
                if not (0 <= x < 1 and 0 <= y < 1 and 0 < rw <= 1 and 0 < rh <= 1 and x+rw <= 1.000001 and y+rh <= 1.000001):
                    raise ValueError('사진 안에서 날짜 영역을 다시 선택해주세요.')
                box = (round(x*w), round(y*h), min(w, round((x+rw)*w)), min(h, round((y+rh)*h)))
                im = im.crop(box)
                if im.width < 100 or im.height < 32:
                    raise ValueError('날짜 영역이 너무 작아요. 더 가까이 촬영해주세요.')
                im.thumbnail((2000, 1200))
                return cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValueError('사진을 읽을 수 없어요. JPG 사진을 다시 선택해주세요.') from exc


def check_quality(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Normalize analysis resolution so thresholds are less sensitive to camera size.
    scale = min(1.0, 800 / gray.shape[1])
    if scale < 1:
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness, contrast = float(gray.mean()), float(gray.std())
    reasons = []
    if brightness < 35: reasons.append('too_dark')
    if contrast < 12: reasons.append('low_contrast')
    if sharpness < 25: reasons.append('blurred')
    return {'passed': not reasons, 'reasons': reasons,
            'sharpness': round(sharpness, 2), 'brightness': round(brightness, 2),
            'contrast': round(contrast, 2), 'note': '품질 지표는 보조 검사이며 날짜 인식 성공을 뜻하지 않습니다.'}


def variants(image):
    # Preserve print dots in the original; aggressive binarization can destroy them.
    yield 'original', image
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    yield 'contrast', cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
