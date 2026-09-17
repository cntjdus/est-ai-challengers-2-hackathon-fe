import io
import numpy as np
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
import app as module
from ocr.images import load_crop

client = TestClient(module.app)
ROI = {'x':'0','y':'0','width':'1','height':'1'}

def photo(blank=False):
    im = Image.new('RGB',(700,180),'white')
    if not blank:
        draw = ImageDraw.Draw(im)
        for i in range(10,650,16): draw.rectangle((i,30,i+6,140),fill='black')
    out = io.BytesIO(); im.save(out,format='PNG'); return out.getvalue()

def post(data=None,roi=None):
    return client.post('/ocr/expiry', files={'file':('date.png', data if data is not None else photo(),'image/png')}, data=roi or ROI)

def test_requires_roi():
    assert client.post('/ocr/expiry',files={'file':('date.png',photo())}).status_code == 422

def test_invalid_image():
    assert post(b'not an image').status_code == 400

def test_invalid_roi():
    assert post(roi={**ROI,'x':'.9','width':'.5'}).status_code == 400

def test_nan_roi():
    assert post(roi={**ROI,'x':'nan'}).status_code in (400,422)

def test_size_limit():
    assert post(b'x'*(10*1024*1024+1)).status_code == 413

def test_quality_stops_engine(monkeypatch):
    def fail(_): raise AssertionError('Engine should not run')
    monkeypatch.setattr(module.engine,'recognize',fail)
    r=post(photo(blank=True))
    assert r.status_code == 200 and r.json()['status'] == 'retake'

def test_contract_with_fake_engine(monkeypatch):
    monkeypatch.setattr(module.engine,'recognize',lambda _: {'reading': {'status':'readable','raw_text':'소비기한 2026.09.30','dates':[{'raw_date':'2026.09.30','raw_label':'소비기한','kind':'use_by','uncertain':False}],'note':''}, 'usage':{}, 'local_budget':{}})
    r=post().json()
    assert r['status'] == 'needs_confirmation' and r['requires_confirmation']
    assert r['candidates'][0]['iso_date'] == '2026-09-30'

def test_engine_failure_not_no_date(monkeypatch):
    def fail(_): raise RuntimeError('download failed')
    monkeypatch.setattr(module.engine,'recognize',fail)
    assert post().status_code == 503
    assert not module.engine.lock.locked()

def test_busy():
    module.engine.lock.acquire()
    try: assert post().status_code == 429
    finally: module.engine.lock.release()

def test_crop_only():
    im=Image.new('RGB',(1000,400),'red');ImageDraw.Draw(im).rectangle((500,0,999,399),fill='blue')
    b=io.BytesIO();im.save(b,format='PNG')
    result=load_crop(b.getvalue(),(.5,0,.5,1))
    assert result.shape[:2] == (400,500)
    assert np.all(result[:,:,0] == 255) and np.all(result[:,:,2] == 0)

def test_ui_served():
    assert client.get('/').status_code == 200
    assert '날짜' in client.get('/').text


def test_provider_quota_and_release(monkeypatch):
    from ocr.engine import EngineError
    def fail(_): raise EngineError('provider_quota', '호출 한도', 429)
    monkeypatch.setattr(module.engine, 'recognize', fail)
    r=post()
    assert r.status_code==429 and r.json()['detail']['code']=='provider_quota'
    assert not module.engine.lock.locked()


def test_health_no_key(monkeypatch,tmp_path):
    monkeypatch.setattr(module.engine.settings,'api_key','unique-secret-key')
    monkeypatch.setattr(module.engine.budget,'path',tmp_path/'usage.db')
    r=client.get('/health')
    assert r.json()['api_key_configured'] and 'unique-secret-key' not in r.text
