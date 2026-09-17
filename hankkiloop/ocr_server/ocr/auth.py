"""Verify the existing app login with Supabase before spending an OCR request."""
import httpx
from fastapi import Header, HTTPException
from .config import Settings

async def require_user(authorization: str = Header(default='')):
    if not authorization.startswith('Bearer ') or len(authorization) < 15:
        raise HTTPException(401, {'code':'login_required','message':'로그인 후 다시 시도해주세요.'})
    settings = Settings()
    if not settings.supabase_url.startswith('https://') or not settings.supabase_key:
        raise HTTPException(503, {'code':'auth_config','message':'hankkiloop/.env.local의 Supabase 설정을 확인해주세요.'})
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(settings.supabase_url+'/auth/v1/user', headers={
                'Authorization': authorization, 'apikey': settings.supabase_key})
    except httpx.HTTPError:
        raise HTTPException(503, {'code':'auth_unavailable','message':'로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해주세요.'}) from None
    if response.status_code in (401,403):
        raise HTTPException(401, {'code':'session_expired','message':'로그인이 만료됐어요. 다시 로그인해주세요.'})
    if response.status_code != 200:
        raise HTTPException(503, {'code':'auth_unavailable','message':'로그인 확인 서버에 연결하지 못했어요.'})
    try:
        user = response.json()
        if not isinstance(user,dict) or not isinstance(user.get('id'),str) or not user['id']: raise ValueError()
        return user['id']
    except ValueError:
        raise HTTPException(503, {'code':'auth_invalid_response','message':'로그인 확인 응답을 읽지 못했어요.'}) from None
