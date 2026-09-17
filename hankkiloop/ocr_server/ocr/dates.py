"""Conservative date extraction. No year inference or global label propagation."""
import re
import unicodedata
from datetime import date

LABELS = re.compile(
    r'(?P<use_by>소\s*비\s*기\s*한|USE\s*BY)|'
    r'(?P<sell_by>유\s*통\s*기\s*한|SELL\s*BY)|'
    r'(?P<best_before>품\s*질\s*유\s*지\s*기\s*한|BEST\s*BEFORE|BBE)|'
    r'(?P<manufactured>제\s*조(?:\s*일\s*자|\s*일)?|생\s*산\s*일|MFG|MFD|MANUFACTURED)|'
    r'(?P<expiry_unspecified>EXP(?:IRY|IRATION)?)', re.I)
PATTERN = re.compile(
    r'(?<![\d.\/\-])(?:'
    r'(?P<y>\d{4}|\d{2})\s*[.\/\-년]\s*(?P<m>\d{1,2})\s*[.\/\-월]\s*(?P<d>\d{1,2})(?:\s*일)?|'
    r'(?P<compact>\d{8})|'
    r'(?P<pm>\d{1,2})\s*[.\/\-월]\s*(?P<pd>\d{1,2})(?:\s*일)?'
    r')(?![\d]|\s*[.\/\-]\s*\d)')
RELATIVE = re.compile(r'(?:제조|생산).*?(?:부터|후)|제조일로|\bAFTER\b', re.I)


def parse_line(text, confidence=1.0, variant='original'):
    text = unicodedata.normalize('NFKC', text).replace('．', '.')
    matches = list(PATTERN.finditer(text))
    labels = list(LABELS.finditer(text))
    out = []
    for i, match in enumerate(matches):
        compact = match['compact']
        year_text = compact[:4] if compact else match['y']
        month = int(compact[4:6] if compact else match['m'] or match['pm'])
        day = int(compact[6:] if compact else match['d'] or match['pd'])
        year = int(year_text) if year_text and len(year_text) == 4 else None
        try:
            date(year if year is not None else 2000, month, day)
        except ValueError:
            continue
        previous_end = matches[i - 1].end() if i else 0
        following_start = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        before = [label for label in labels if previous_end <= label.start() and label.end() <= match.start()]
        after = [label for label in labels if match.end() <= label.start() and label.end() <= following_start]
        # Prefer a prefix. A suffix is accepted only for the last date on the line;
        # otherwise it might label the NEXT date (MFG date EXP date).
        label = before[-1] if before else (after[0] if after and i == len(matches)-1 else None)
        kind = label.lastgroup if label else 'unknown'
        warnings = []
        if year is None:
            warnings.append('two_digit_year' if year_text else 'missing_year')
        if kind in {'unknown', 'expiry_unspecified'}:
            warnings.append('confirm_date_kind')
        if RELATIVE.search(text):
            warnings.append('relative_date_expression')
            kind = 'unknown'
        engine_confidence = max(0.0, min(1.0, float(confidence)))
        if engine_confidence < 0.65:
            warnings.append('low_ocr_confidence')
        out.append({
            'raw': match.group(), 'year_text': year_text, 'month': month, 'day': day,
            'iso_date': date(year, month, day).isoformat() if year else None,
            'kind': kind, 'source_text': text, 'variant': variant,
            'engine_confidence': round(engine_confidence, 4),
            'candidate_score': round(engine_confidence * 0.6 + (0.25 if year else 0) + (0.15 if label else 0), 4),
            'warnings': warnings,
        })
    return out


def extract_candidates(lines):
    unique = {}
    for line in lines:
        for candidate in parse_line(line['text'], line['confidence'], line.get('variant', 'original')):
            key = (candidate['year_text'], candidate['month'], candidate['day'], candidate['kind'])
            old = unique.get(key)
            if old is None or candidate['candidate_score'] > old['candidate_score']:
                unique[key] = candidate
    return [dict(c, id=f'date-{i+1}') for i, c in enumerate(
        sorted(unique.values(), key=lambda c: c['candidate_score'], reverse=True)[:20])]


def make_result(lines, quality):
    candidates = extract_candidates(lines)
    readable = any(c['engine_confidence'] >= 0.65 for c in candidates)
    return {
        'schema_version': '1.0',
        'status': 'needs_confirmation' if readable else ('low_confidence' if candidates else 'no_date'),
        'requires_confirmation': True,
        'quality': quality, 'candidates': candidates, 'ocr_lines': lines,
        'message': '사진과 날짜·종류를 확인해주세요.' if readable else '날짜를 더 크게, 선명하게 다시 촬영해주세요.',
    }


def make_gemini_result(payload, quality):
    reading = payload['reading']
    candidates, rejected, seen = [], 0, set()
    normalize = lambda value: re.sub(r'\s+','',unicodedata.normalize('NFKC',value)).casefold()
    transcript = normalize(reading['raw_text'])
    for item in reading['dates']:
        raw = item['raw_date']
        cleaned = re.sub(r'[.\s]+\d{1,2}:\d{2}(?::\d{2})?\s*$','',raw)
        parsed = parse_line(cleaned,variant='gemini')
        if len(parsed)!=1 or normalize(parsed[0]['raw']).rstrip('.')!=normalize(cleaned).rstrip('.') or normalize(raw) not in transcript:
            rejected += 1
            continue
        c = parsed[0]
        label = item['raw_label']
        match = LABELS.search(label) if normalize(label) in transcript else None
        c['kind'] = match.lastgroup if match else 'unknown'
        c['warnings'] = [w for w in c['warnings'] if w!='confirm_date_kind']
        if c['kind'] in {'unknown','expiry_unspecified'}: c['warnings'].append('confirm_date_kind')
        if item['kind']!=c['kind']:
            c['warnings'].append('label_mismatch');c['kind']='unknown'
        if RELATIVE.search(reading['raw_text']):
            c['kind']='unknown';c['warnings'].append('relative_date_expression')
        if item['uncertain'] or reading['status']!='readable': c['warnings'].append('uncertain_reading')
        c.update(raw=cleaned,raw_label=label,source_text=(label+' '+raw).strip(),engine_confidence=None,candidate_score=None)
        key=(c['year_text'],c['month'],c['day'],c['kind'])
        if key in seen: continue
        seen.add(key);c['id']=f'date-{len(candidates)+1}';candidates.append(c)
    uncertain = reading['status']!='readable' or any('uncertain_reading' in c['warnings'] or 'label_mismatch' in c['warnings'] for c in candidates)
    status = ('uncertain' if uncertain else 'needs_confirmation') if candidates else 'no_date'
    message = ('일부 글자나 날짜 종류가 불확실해요. 사진과 비교해주세요.' if uncertain else '날짜 후보를 읽었어요. 사진과 날짜·종류를 확인해주세요.') if candidates else '유효한 날짜를 확인하지 못했어요. 읽은 원문을 확인하거나 직접 입력해주세요.'
    return {'schema_version':'2.0','status':status,'requires_confirmation':True,'quality':quality,
        'candidates':candidates,'ocr_lines':[{'text':line,'confidence':None,'variant':'gemini'} for line in reading['raw_text'].splitlines()],
        'raw_text':reading['raw_text'],'model_note':reading['note'],'rejected_date_count':rejected,
        'message':message,'usage':payload['usage'],'local_budget':payload['local_budget']}
