from pathlib import Path
import runpy

def test_reads_hankkiloop_env_local_without_current_directory_dependency(tmp_path,monkeypatch):
    app_root=tmp_path/'hankkiloop'
    module_path=app_root/'ocr_server'/'ocr'/'config.py'
    module_path.parent.mkdir(parents=True)
    module_path.write_text((Path(__file__).parents[1]/'ocr'/'config.py').read_text())
    (app_root/'.env.local').write_text('GEMINI_API_KEY=fake-local-key\nVITE_SUPABASE_URL=https://local.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=public-local-key\nOCR_DAILY_LIMIT=7\n',encoding='utf-8-sig')
    (app_root/'.env').write_text('GEMINI_API_KEY=fake-base-key\n')
    for key in ['GEMINI_API_KEY','VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_ANON_KEY','OCR_DAILY_LIMIT']:
        monkeypatch.delenv(key,raising=False)
    monkeypatch.chdir(tmp_path)
    settings=runpy.run_path(str(module_path))['Settings']()
    assert settings.api_key=='fake-local-key'
    assert settings.supabase_url=='https://local.supabase.co'
    assert settings.supabase_key=='public-local-key' and settings.daily_limit==7
