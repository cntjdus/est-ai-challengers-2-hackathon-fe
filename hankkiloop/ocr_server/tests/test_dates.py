import pytest
from ocr.dates import parse_line, extract_candidates, make_result

@pytest.mark.parametrize('text,expected', [
    ('소비기한 2026.09.30', '2026-09-30'),
    ('유통기한 2026/9/3', '2026-09-03'),
    ('제조일자 2026년 9월 16일', '2026-09-16'),
    ('BEST BEFORE 20260930', '2026-09-30'),
    ('소 비 기 한 ２０２６．０９．３０', '2026-09-30'),
    ('2024-02-29', '2024-02-29'),
])
def test_valid(text, expected):
    assert parse_line(text)[0]['iso_date'] == expected

@pytest.mark.parametrize('text', ['2026.02.30','2026.13.01','2026-00-12','2025-02-29','12:30','1234567890123','2026.09.999'])
def test_invalid_does_not_become_partial(text):
    assert parse_line(text) == []

def test_year_never_inferred():
    for text,warning in [('09.30','missing_year'), ('26.09.30','two_digit_year')]:
        c = parse_line(text)[0]
        assert c['iso_date'] is None
        assert warning in c['warnings']

def test_mixed_labels():
    c = parse_line('MFG 2026.09.01 EXP 2026.09.30')
    assert [x['kind'] for x in c] == ['manufactured','expiry_unspecified']

def test_next_label_does_not_attach_backwards():
    assert [c['kind'] for c in parse_line('2026.09.01 EXP 2026.09.30')] == ['unknown','expiry_unspecified']

def test_label_on_another_line_not_promoted():
    c = extract_candidates([{'text':'소비기한','confidence':.99}, {'text':'2026.09.30','confidence':.95}])
    assert c[0]['kind'] == 'unknown'

def test_type_separation():
    for text,kind in [('소비기한','use_by'),('유통기한','sell_by'),('품질유지기한','best_before'),('제조일','manufactured')]:
        assert parse_line(text+' 2026.09.30')[0]['kind'] == kind

def test_low_confidence_cannot_be_success():
    r = make_result([{'text':'EXP 2026.09.30','confidence':.2}], {'passed':True})
    assert r['status'] == 'low_confidence'

def test_no_date_separate_from_quality():
    r = make_result([{'text':'우유','confidence':.99}], {'passed':True})
    assert r['status'] == 'no_date'

def test_relative_expression_not_expiry():
    c = parse_line('제조일 2026.09.01 부터 10일')[0]
    assert c['kind'] == 'unknown'
    assert 'relative_date_expression' in c['warnings']

def test_variants_do_not_inflate_confidence():
    r = extract_candidates([{'text':'2026.09.30','confidence':.3,'variant':v} for v in ['original','contrast']])
    assert len(r) == 1 and r[0]['engine_confidence'] == .3

