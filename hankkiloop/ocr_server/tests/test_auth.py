import httpx
import pytest
from fastapi.testclient import TestClient
import app as module
from ocr import auth

client=TestClient(module.app)

def test_no_login_never_calls_ocr(monkeypatch):
    monkeypatch.setattr(module.engine,'recognize',lambda _:pytest.fail('Should not call Gemini'))
    response=client.post('/ocr/expiry')
    assert response.status_code==401
    assert response.json()['detail']['code']=='login_required'

@pytest.mark.parametrize('status,body,expected',[(401,{},401),(500,{},503),(200,{},503),(200,{'id':'verified-user'},422)])
def test_auth_verifies_existing_supabase_session(monkeypatch,status,body,expected):
    from types import SimpleNamespace
    monkeypatch.setattr(auth,'Settings',lambda:SimpleNamespace(supabase_url='https://test.supabase.co',supabase_key='public-test-key'))
    class FakeClient:
        def __init__(self,**kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
        async def get(self,url,headers):
            assert url=='https://test.supabase.co/auth/v1/user'
            assert headers=={'Authorization':'Bearer test-login-token','apikey':'public-test-key'}
            return httpx.Response(status,json=body)
    monkeypatch.setattr(auth.httpx,'AsyncClient',FakeClient)
    # Valid session gets past auth and reaches form validation; invalid one fails first.
    response=client.post('/ocr/expiry',headers={'Authorization':'Bearer test-login-token'})
    assert response.status_code==expected
