import json
import httpx
import numpy as np
import pytest
from google import genai
from google.genai import types
from ocr.config import Settings
from ocr.engine import GeminiEngine, EngineError, DailyBudget
from ocr.dates import make_gemini_result

READING={'status':'readable','raw_text':'제조일자 03.02.00:51\n유통기한 03.13.00:51','dates':[
 {'raw_date':'03.02','raw_label':'제조일자','kind':'manufactured','uncertain':False},
 {'raw_date':'03.13','raw_label':'유통기한','kind':'sell_by','uncertain':False}],'note':''}
def payload(r):return {'reading':r,'usage':{},'local_budget':{}}
def test_yearless_milk():
    r=make_gemini_result(payload(READING),{})
    assert [c['kind'] for c in r['candidates']]==['manufactured','sell_by']
    assert [c['day'] for c in r['candidates']]==[2,13]
    assert all(c['iso_date'] is None and c['engine_confidence'] is None for c in r['candidates'])
    assert r['requires_confirmation']
def test_clock_not_year():
    r=json.loads(json.dumps(READING));r['dates'][0]['raw_date']='03.02.00:51'
    c=make_gemini_result(payload(r),{})['candidates'][0]
    assert c['month']==3 and c['day']==2 and c['year_text'] is None
@pytest.mark.parametrize('raw',['2026.02.30','2026.03.13','09.30'])
def test_invalid_or_untranscribed_rejected(raw):
    r=json.loads(json.dumps(READING));r['dates']=[dict(r['dates'][0],raw_date=raw)]
    out=make_gemini_result(payload(r),{})
    assert not out['candidates'] and out['rejected_date_count']==1
def test_no_label_not_assumed():
    r={'status':'readable','raw_text':'03.13','dates':[{'raw_date':'03.13','raw_label':'','kind':'sell_by','uncertain':False}],'note':''}
    assert make_gemini_result(payload(r),{})['candidates'][0]['kind']=='unknown'
def test_budget_persists(tmp_path):
    path=tmp_path/'usage.db';DailyBudget(path,1).reserve()
    assert DailyBudget(path,1).snapshot()['attempts']==1
    with pytest.raises(EngineError):DailyBudget(path,1).reserve()
    assert DailyBudget(path,1).snapshot()['attempts']==1

def engine_for(tmp_path,handler):
    s=Settings();s.api_key='fake-test-key';s.usage_path=tmp_path/'usage.db'
    transport=httpx.MockTransport(handler)
    client=genai.Client(api_key=s.api_key,vertexai=False,http_options=types.HttpOptions(
        retry_options=types.HttpRetryOptions(attempts=1),
        httpx_client=httpx.Client(transport=transport),httpx_async_client=httpx.AsyncClient(transport=transport)))
    return GeminiEngine(s,client)
def response(r=READING,finish='STOP'):
    return {'candidates':[{'content':{'role':'model','parts':[{'text':json.dumps(r,ensure_ascii=False)}]},'finishReason':finish}],
            'usageMetadata':{'promptTokenCount':200,'candidatesTokenCount':100,'totalTokenCount':300}}
def test_real_sdk_serialization(tmp_path):
    calls=[]
    def handler(req):calls.append(req);return httpx.Response(200,json=response())
    e=engine_for(tmp_path,handler);out=e.recognize(np.zeros((80,240,3),dtype=np.uint8))
    assert len(calls)==1 and 'gemini-3.8-flash:generateContent' in str(calls[0].url)
    body=json.loads(calls[0].content)
    assert sum('inlineData' in p for p in body['contents'][0]['parts'])==1
    assert body['generationConfig']['responseMimeType']=='application/json'
    assert body['generationConfig']['thinkingConfig']['thinking_level']=='LOW'
    assert 'untrusted data' in body['systemInstruction']['parts'][0]['text']
    assert 'candidateCount' not in body['generationConfig']
    assert out['reading']==READING and out['usage']['total_token_count']==300
    e.client.close()
@pytest.mark.parametrize('code,expected',[(429,'provider_quota'),(403,'api_access'),(404,'model_unavailable'),(500,'provider_unavailable')])
def test_error_no_retry(tmp_path,code,expected):
    calls=[]
    def handler(req):calls.append(req);return httpx.Response(code,json={'error':{'code':code,'message':'secret-key'}})
    e=engine_for(tmp_path,handler)
    with pytest.raises(EngineError) as exc:e.recognize(np.zeros((80,240,3),dtype=np.uint8))
    assert exc.value.code==expected and 'secret' not in str(exc.value)
    assert len(calls)==1 and e.budget.snapshot()['attempts']==1
    e.client.close()
@pytest.mark.parametrize('body,expected',[(response(finish='MAX_TOKENS'),'incomplete_response'),(response({'bad':'schema'}),'invalid_response')])
def test_bad_response(tmp_path,body,expected):
    e=engine_for(tmp_path,lambda req:httpx.Response(200,json=body))
    with pytest.raises(EngineError) as exc:e.recognize(np.zeros((80,240,3),dtype=np.uint8))
    assert exc.value.code==expected;e.client.close()
def test_missing_key_no_request(tmp_path):
    e=engine_for(tmp_path,lambda req:pytest.fail('Unexpected request'));e.settings.api_key=''
    with pytest.raises(EngineError) as exc:e.recognize(np.zeros((80,240,3),dtype=np.uint8))
    assert exc.value.code=='missing_api_key' and e.budget.snapshot()['attempts']==0;e.client.close()
def test_timeout_no_retry(tmp_path):
    calls=[]
    def handler(req):calls.append(req);raise httpx.ReadTimeout('timeout',request=req)
    e=engine_for(tmp_path,handler)
    with pytest.raises(EngineError) as exc:e.recognize(np.zeros((80,240,3),dtype=np.uint8))
    assert exc.value.code=='api_timeout' and len(calls)==1;e.client.close()
def test_budget_blocks_network(tmp_path):
    e=engine_for(tmp_path,lambda req:pytest.fail('Unexpected request'));e.budget.limit=1;e.budget.reserve()
    with pytest.raises(EngineError) as exc:e.recognize(np.zeros((80,240,3),dtype=np.uint8))
    assert exc.value.code=='local_daily_limit';e.client.close()
