import os
import re
import sys
import logging
from typing import List, Optional, Tuple

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from util.regions import UA_TO_EN, REGIONS

logger = logging.getLogger(__name__)

MODEL_NAME = "ukr-models/uk-ner"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UA_FILE = os.path.join(ROOT, "datasets", "UA.txt")

ADMIN1_TO_REGION: dict = {
    "01": "Cherkasy",       "02": "Chernihiv",      "03": "Chernivtsi",
    "04": "Dnipropetrovsk", "05": "Donetsk",        "06": "Ivano-Frankivsk",
    "07": "Kharkiv",        "08": "Kherson",        "09": "Khmelnytskyi",
    "10": "Kyiv Oblast",    "11": "Crimea",         "12": "Kirovohrad",
    "13": "Luhansk",        "14": "Lviv",           "15": "Mykolaiv",
    "16": "Odesa",          "17": "Odesa",          "18": "Poltava",
    "19": "Rivne",          "20": "Sumy",           "21": "Ternopil",
    "22": "Vinnytsia",      "23": "Volyn",          "24": "Zakarpattia",
    "25": "Zaporizhzhia",   "26": "Zhytomyr",       "30": "Kyiv City",
}

_PREPOSITIONS = {
    "по", "на", "у", "в", "до", "від", "під", "над", "за", "із",
    "з", "через", "між", "біля", "поблизу", "навколо", "щодо",
}

_GEONAMES_BLOCKLIST = {
    "львов",
    "по", "на", "у", "в", "до", "від", "під", "над", "за",
    "район", "місто", "село", "вулиця",
}

_REGEX_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r'\bхарківщин\w*\b', re.I), "Kharkiv"),
    (re.compile(r'\bхарків\b', re.I), "Kharkiv"),
    (re.compile(r'\bкуп.янськ\w+\b', re.I), "Kharkiv"),
    (re.compile(r'\bізюм\w*\b', re.I), "Kharkiv"),
    (re.compile(r'\bчугуїв\w*\b', re.I), "Kharkiv"),
    (re.compile(r'\bмаріупол[ьяюієм]\b', re.I), "Donetsk"),
    (re.compile(r'\bкраматорськ\w*\b', re.I), "Donetsk"),
    (re.compile(r'\bавдіівк\w+\b', re.I), "Donetsk"),
    (re.compile(r'\bавдіївк\w+\b', re.I), "Donetsk"),
    (re.compile(r'\bслов.янськ\w+\b', re.I), "Donetsk"),
    (re.compile(r'\bлиман\w*\b', re.I), "Donetsk"),
    (re.compile(r'\bдніпропетровщин\w*\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bкривого рог[уа]\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bкривим рогом\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bкривому розі\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bкривий ріг\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bкам.янськ\w+\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bнікопол[ьяюієм]\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bпавлоград\w*\b', re.I), "Dnipropetrovsk"),
    (re.compile(r'\bзапорізьк\w+\s+напрямк\w+\b', re.I), "Zaporizhzhia"),
    (re.compile(r'\bзапорізьк\w+\s+фронт\w+\b', re.I), "Zaporizhzhia"),
    (re.compile(r'\bзапорізьк\w+\b', re.I), "Zaporizhzhia"),
    (re.compile(r'\bмелітопол[ьяюієм]\b', re.I), "Zaporizhzhia"),
    (re.compile(r'\bбердянськ\w*\b', re.I), "Zaporizhzhia"),
    (re.compile(r'\bенергодар\w*\b', re.I), "Zaporizhzhia"),
    (re.compile(r'\bсєвєродонецьк\w*\b', re.I), "Luhansk"),
    (re.compile(r'\bлисичанськ\w*\b', re.I), "Luhansk"),
    (re.compile(r'\bрубіжн\w+\b', re.I), "Luhansk"),
    (re.compile(r'\bсумщин\w*\b', re.I), "Sumy"),
    (re.compile(r'\bохтирк\w+\b', re.I), "Sumy"),
    (re.compile(r'\bконотоп\w*\b', re.I), "Sumy"),
    (re.compile(r'\bшостк\w+\b', re.I), "Sumy"),
    (re.compile(r'\bна\s+суми\b', re.I), "Sumy"),
    (re.compile(r'\bу\s+сум[иіах]+\b', re.I), "Sumy"),
    (re.compile(r'\bв\s+сум[иіах]+\b', re.I), "Sumy"),
    (re.compile(r'\bдо\s+сум\b', re.I), "Sumy"),
    (re.compile(r'\bбіля\s+сум\b', re.I), "Sumy"),
    (re.compile(r'\bвід\s+сум\b', re.I), "Sumy"),
    (re.compile(r'\bна\s+схід\w*\s+від\s+сум\b', re.I), "Sumy"),
    (re.compile(r'\bсуми\b', re.I), "Sumy"),
    (re.compile(r'\bчернігівщин\w*\b', re.I), "Chernihiv"),
    (re.compile(r'\bмиколаївщин\w*\b', re.I), "Mykolaiv"),
    (re.compile(r'\bочаків\w*\b', re.I), "Mykolaiv"),
    (re.compile(r'\bвознесенськ\w*\b', re.I), "Mykolaiv"),
    (re.compile(r'\bхерсонщин\w*\b', re.I), "Kherson"),
    (re.compile(r'\bнов\w+\s+каховк\w+\b', re.I), "Kherson"),
    (re.compile(r'\bчорнобаївк\w+\b', re.I), "Kherson"),
    (re.compile(r'\bодещин\w*\b', re.I), "Odesa"),
    (re.compile(r'\bізмаїл\w*\b', re.I), "Odesa"),
    (re.compile(r'\bзатоку\b|\bзатоці\b|\bзатока\b', re.I), "Odesa"),
    (re.compile(r'\bполтавщин\w*\b', re.I), "Poltava"),
    (re.compile(r'\bбіл\w+\s+церкв\w+\b', re.I), "Kyiv Oblast"),
    (re.compile(r'\bбуч[аіи]\b', re.I), "Kyiv Oblast"),
    (re.compile(r'\bірпін[ьяюі]\b', re.I), "Kyiv Oblast"),
    (re.compile(r'\bгостомел[ьяюі]\b', re.I), "Kyiv Oblast"),
    (re.compile(r'\bбровар\w+\b', re.I), "Kyiv Oblast"),
    (re.compile(r'\bборисполь\w*|бориспол[яюіьє]\b', re.I), "Kyiv Oblast"),
    (re.compile(r'\bфастів\w*\b', re.I), "Kyiv Oblast"),
    (re.compile(r'\bльвов[іиа]?\b', re.I), "Lviv"),
    (re.compile(r'\bльвом\b', re.I), "Lviv"),
    (re.compile(r'\bволинщин\w*\b', re.I), "Volyn"),
    (re.compile(r'\bрівн[еє]щин\w*\b', re.I), "Rivne"),
    (re.compile(r'\bзакарпатщин\w*\b', re.I), "Zakarpattia"),
    (re.compile(r'\bприкарпатщин\w*\b', re.I), "Ivano-Frankivsk"),
    (re.compile(r'\bумань\w*|умані\b', re.I), "Cherkasy"),
    (re.compile(r'\bсум\b', re.I), "Sumy"),
    (re.compile(r'\bхаркова\b', re.I), "Kharkiv"),
    (re.compile(r'\bна\s+запоріжж[яі]\b', re.I), "Zaporizhzhia"),
    (re.compile(r'\bзапоріжж[яі]\b', re.I), "Zaporizhzhia")
]

def _regex_extract(text: str) -> List[str]:
    seen: set = set()
    regions: List[str] = []
    for pattern, region in _REGEX_PATTERNS:
        if pattern.search(text) and region not in seen:
            seen.add(region)
            regions.append(region)
    return regions

_UA_TO_EN: dict = {k.lower(): v for k, v in UA_TO_EN.items() if v}
_EN_NAMES: dict = {v.lower(): v for _, (_, _, v) in REGIONS.items()}

_ALIASES: dict = {
    "харківська":                "Kharkiv",
    "харківська область":        "Kharkiv",
    "херсонська":                "Kherson",
    "херсонська область":        "Kherson",
    "запорізька":                "Zaporizhzhia",
    "запорізька область":        "Zaporizhzhia",
    "запорожжя":                 "Zaporizhzhia",
    "донецька":                  "Donetsk",
    "донецька область":          "Donetsk",
    "луганська":                 "Luhansk",
    "луганська область":         "Luhansk",
    "миколаївська":              "Mykolaiv",
    "миколаївська область":      "Mykolaiv",
    "одеська":                   "Odesa",
    "одеська область":           "Odesa",
    "київська":                  "Kyiv Oblast",
    "київська область":          "Kyiv Oblast",
    "сумська":                   "Sumy",
    "сумська область":           "Sumy",
    "чернігівська":              "Chernihiv",
    "чернігівська область":      "Chernihiv",
    "дніпропетровська":          "Dnipropetrovsk",
    "дніпропетровська область":  "Dnipropetrovsk",
    "полтавська":                "Poltava",
    "полтавська область":        "Poltava",
    "львівська":                 "Lviv",
    "львівська область":         "Lviv",
    "вінницька":                 "Vinnytsia",
    "вінницька область":         "Vinnytsia",
    "житомирська":               "Zhytomyr",
    "житомирська область":       "Zhytomyr",
    "рівненська":                "Rivne",
    "рівненська область":        "Rivne",
    "волинська":                 "Volyn",
    "волинська область":         "Volyn",
    "тернопільська":             "Ternopil",
    "тернопільська область":     "Ternopil",
    "хмельницька":               "Khmelnytskyi",
    "хмельницька область":       "Khmelnytskyi",
    "черкаська":                 "Cherkasy",
    "черкаська область":         "Cherkasy",
    "чернівецька":               "Chernivtsi",
    "чернівецька область":       "Chernivtsi",
    "закарпатська":              "Zakarpattia",
    "закарпатська область":      "Zakarpattia",
    "івано-франківська":         "Ivano-Frankivsk",
    "івано-франківська область": "Ivano-Frankivsk",
    "кіровоградська":            "Kirovohrad",
    "кіровоградська область":    "Kirovohrad",
    "харківський":               "Kharkiv",
    "херсонський":               "Kherson",
    "запорізький":               "Zaporizhzhia",
    "донецький":                 "Donetsk",
    "луганський":                "Luhansk",
    "миколаївський":             "Mykolaiv",
    "одеський":                  "Odesa",
    "київський":                 "Kyiv Oblast",
    "сумський":                  "Sumy",
    "чернігівський":             "Chernihiv",
    "дніпропетровський":         "Dnipropetrovsk",
    "полтавський":               "Poltava",
    "львівський":                "Lviv",
    "вінницький":                "Vinnytsia",
    "житомирський":              "Zhytomyr",
    "рівненський":               "Rivne",
    "волинський":                "Volyn",
    "тернопільський":            "Ternopil",
    "хмельницький":              "Khmelnytskyi",
    "черкаський":                "Cherkasy",
    "чернівецький":              "Chernivtsi",
    "закарпатський":             "Zakarpattia",
    "івано-франківський":        "Ivano-Frankivsk",
    "кіровоградський":           "Kirovohrad",
    "кримський":                 "Crimea",
    "харків":                    "Kharkiv",
    "харківщина":                "Kharkiv",
    "херсон":                    "Kherson",
    "херсонщина":                "Kherson",
    "запоріжжя":                 "Zaporizhzhia",
    "донецьк":                   "Donetsk",
    "донеччина":                 "Donetsk",
    "луганськ":                  "Luhansk",
    "луганщина":                 "Luhansk",
    "миколаїв":                  "Mykolaiv",
    "миколаївщина":              "Mykolaiv",
    "одеса":                     "Odesa",
    "одещина":                   "Odesa",
    "київ":                      "Kyiv City",
    "київщина":                  "Kyiv Oblast",
    "суми":                      "Sumy",
    "сум":                       "Sumy",
    "сумах":                     "Sumy",
    "сумщина":                   "Sumy",
    "чернігів":                  "Chernihiv",
    "чернігівщина":              "Chernihiv",
    "дніпро":                    "Dnipropetrovsk",
    "дніпропетровськ":           "Dnipropetrovsk",
    "дніпропетровщина":          "Dnipropetrovsk",
    "придніпров'я":              "Dnipropetrovsk",
    "полтава":                   "Poltava",
    "полтавщина":                "Poltava",
    "львів":                     "Lviv",
    "львові":                    "Lviv",
    "львова":                    "Lviv",
    "львову":                    "Lviv",
    "львовом":                   "Lviv",
    "львівщина":                 "Lviv",
    "вінниця":                   "Vinnytsia",
    "вінниччина":                "Vinnytsia",
    "житомир":                   "Zhytomyr",
    "житомирщина":               "Zhytomyr",
    "рівне":                     "Rivne",
    "рівненщина":                "Rivne",
    "волинь":                    "Volyn",
    "волинщина":                 "Volyn",
    "тернопіль":                 "Ternopil",
    "тернопільщина":             "Ternopil",
    "хмельниччина":              "Khmelnytskyi",
    "черкаси":                   "Cherkasy",
    "черкащина":                 "Cherkasy",
    "чернівці":                  "Chernivtsi",
    "буковина":                  "Chernivtsi",
    "закарпаття":                "Zakarpattia",
    "закарпатщина":              "Zakarpattia",
    "івано-франківськ":          "Ivano-Frankivsk",
    "прикарпаття":               "Ivano-Frankivsk",
    "прикарпатщина":             "Ivano-Frankivsk",
    "кіровоград":                "Kirovohrad",
    "кропивницький":             "Kirovohrad",
    "кіровоградщина":            "Kirovohrad",
    "крим":                      "Crimea",
    "затока":                    "Odesa",
    "затоці":                    "Odesa",
    "затоку":                    "Odesa",
    "кривий ріг":                "Dnipropetrovsk",
    "кривому розі":              "Dnipropetrovsk",
    "кривого рогу":              "Dnipropetrovsk",
    "кривим рогом":              "Dnipropetrovsk",
    "бахмут":                    "Donetsk",
    "бахмуті":                   "Donetsk",
    "бахмута":                   "Donetsk",
    "бахмутом":                  "Donetsk",
    "маріуполь":                 "Donetsk",
    "маріуполі":                 "Donetsk",
    "маріуполя":                 "Donetsk",
    "маріуполем":                "Donetsk",
    "маріуполю":                 "Donetsk",
    "авдіївка":                  "Donetsk",
    "авдіївці":                  "Donetsk",
    "авдіївку":                  "Donetsk",
    "авдіівка":                  "Donetsk",
    "краматорськ":               "Donetsk",
    "краматорська":              "Donetsk",
    "слов'янськ":                "Donetsk",
    "лиман":                     "Donetsk",
    "лимані":                    "Donetsk",
    "сєвєродонецьк":             "Luhansk",
    "лисичанськ":                "Luhansk",
    "рубіжне":                   "Luhansk",
    "мелітополь":                "Zaporizhzhia",
    "мелітополі":                "Zaporizhzhia",
    "енергодар":                 "Zaporizhzhia",
    "бердянськ":                 "Zaporizhzhia",
    "нікополь":                  "Dnipropetrovsk",
    "нікополі":                  "Dnipropetrovsk",
    "кам'янське":                "Dnipropetrovsk",
    "павлоград":                 "Dnipropetrovsk",
    "охтирка":                   "Sumy",
    "шостка":                    "Sumy",
    "конотоп":                   "Sumy",
    "ізюм":                      "Kharkiv",
    "ізюмі":                     "Kharkiv",
    "куп'янськ":                 "Kharkiv",
    "чугуїв":                    "Kharkiv",
    "нова каховка":              "Kherson",
    "новій каховці":             "Kherson",
    "чорнобаївка":               "Kherson",
    "очаків":                    "Mykolaiv",
    "вознесенськ":               "Mykolaiv",
    "ізмаїл":                    "Odesa",
    "білгород-дністровський":    "Odesa",
    "умань":                     "Cherkasy",
    "умані":                     "Cherkasy",
    "буча":                      "Kyiv Oblast",
    "бучі":                      "Kyiv Oblast",
    "бучу":                      "Kyiv Oblast",
    "ірпінь":                    "Kyiv Oblast",
    "ірпені":                    "Kyiv Oblast",
    "гостомель":                 "Kyiv Oblast",
    "гостомелі":                 "Kyiv Oblast",
    "бровари":                   "Kyiv Oblast",
    "броварах":                  "Kyiv Oblast",
    "біла церква":               "Kyiv Oblast",
    "білій церкві":              "Kyiv Oblast",
    "фастів":                    "Kyiv Oblast",
    "бориспіль":                 "Kyiv Oblast",
    "kharkiv region":            "Kharkiv",
    "kherson region":            "Kherson",
    "donetsk region":            "Donetsk",
    "luhansk region":            "Luhansk",
    "zaporizhzhia region":       "Zaporizhzhia",
    "kyiv region":               "Kyiv Oblast",
    "dnipro":                    "Dnipropetrovsk",
    "bakhmut":                   "Donetsk",
    "mariupol":                  "Donetsk",
    "kherson":                   "Kherson",
    "mykolaiv":                  "Mykolaiv",
    "lviv":                      "Lviv",
    "odesa":                     "Odesa",
    "odessa":                    "Odesa",
    "zaporizhzhia":              "Zaporizhzhia",
}

REGION_LOOKUP: dict = {**_UA_TO_EN, **_EN_NAMES, **_ALIASES}

CITY_TO_REGION: dict = {}

def _build_geonames_index() -> dict:
    index: dict = {}
    if not os.path.exists(UA_FILE):
        logger.warning(f"UA.txt not found at {UA_FILE} - GeoNames fallback disabled")
        return index
    logger.info("Building GeoNames city index...")
    with open(UA_FILE, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) < 11:
                continue
            admin1 = parts[10].strip().zfill(2)
            region = ADMIN1_TO_REGION.get(admin1)
            if not region:
                continue
            names: set = set()
            names.add(parts[1].strip().lower())
            names.add(parts[2].strip().lower())
            for alt in parts[3].split(","):
                alt = alt.strip().lower()
                if alt and len(alt) >= 4:
                    names.add(alt)
            for name in names:
                if name and name not in REGION_LOOKUP and name not in index:
                    index[name] = region
    logger.info(f"GeoNames index: {len(index)} place names")
    return index

CITY_TO_REGION = _build_geonames_index()

_morph = None

def _get_morph():
    global _morph
    if _morph is None:
        import pymorphy3
        _morph = pymorphy3.MorphAnalyzer(lang='uk')
    return _morph

def _lemmatize(text: str) -> str:
    morph = _get_morph()
    return " ".join(morph.parse(w)[0].normal_form for w in text.split())

def _strip_preposition(text: str) -> str:
    words = text.split()
    if len(words) > 1 and words[0] in _PREPOSITIONS:
        return " ".join(words[1:])
    return text

def _normalize(entity_text: str) -> Optional[str]:
    key = entity_text.strip().lower()
    if not key:
        return None

    key = _strip_preposition(key)
    if not key:
        return None

    if key in REGION_LOOKUP:
        return REGION_LOOKUP[key]

    lemma = _lemmatize(key)
    if lemma in REGION_LOOKUP:
        return REGION_LOOKUP[lemma]

    lemma_stripped = lemma.replace(" область", "").strip()
    if lemma_stripped and lemma_stripped in REGION_LOOKUP:
        return REGION_LOOKUP[lemma_stripped]

    if key in CITY_TO_REGION:
        return CITY_TO_REGION[key]

    if " " not in lemma and lemma not in _GEONAMES_BLOCKLIST:
        if lemma in CITY_TO_REGION:
            return CITY_TO_REGION[lemma]

    return None

_pipeline = None

def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
        logger.info(f"Loading NER model: {MODEL_NAME}")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForTokenClassification.from_pretrained(MODEL_NAME)
        _pipeline = pipeline(
            task="ner",
            model=model,
            tokenizer=tokenizer,
            aggregation_strategy="none",
            device=-1,
        )
        logger.info("NER model ready.")
    return _pipeline


def _merge_tokens(entities: list, original_text: str) -> List[str]:
    if not entities:
        return []
    merged = []
    current_start = current_end = None
    for ent in entities:
        tag = ent.get("entity") or ent.get("entity_group", "")
        is_loc = "LOC" in tag or "GPE" in tag or "ORG" in tag
        if not is_loc:
            if current_start is not None:
                merged.append(original_text[current_start:current_end].strip())
                current_start = current_end = None
            continue
        if current_start is None:
            current_start, current_end = ent["start"], ent["end"]
        elif ent["start"] <= current_end + 1:
            current_end = ent["end"]
        else:
            merged.append(original_text[current_start:current_end].strip())
            current_start, current_end = ent["start"], ent["end"]
    if current_start is not None:
        merged.append(original_text[current_start:current_end].strip())
    return [s for s in merged if s]

def smart_extract(text: str) -> Optional[str]:
    regions = smart_extract_all(text)
    return regions[0] if regions else None


def smart_extract_all(text: str) -> List[str]:
    if not text or not text.strip():
        return []

    seen: set = set()
    regions: List[str] = []

    def _add(region: Optional[str]):
        if region and region not in seen:
            seen.add(region)
            regions.append(region)

    for region in _regex_extract(text):
        _add(region)

    text_trunc = text[:512]
    nlp = _get_pipeline()
    try:
        raw_entities = nlp(text_trunc)
    except Exception as e:
        logger.warning(f"NER failed: {e}")
        return regions

    spans = _merge_tokens(raw_entities, text_trunc)
    for span in spans:
        _add(_normalize(span))

    return regions

def _process_batch(nlp, txts: list) -> List[List[str]]:
    results = []
    try:
        ner_outputs = nlp(list(txts))
        for entities, orig in zip(ner_outputs, txts):
            seen: set = set()
            regions: List[str] = []

            def _add(region):
                if region and region not in seen:
                    seen.add(region)
                    regions.append(region)

            for region in _regex_extract(orig):
                _add(region)

            spans = _merge_tokens(entities, orig)
            for span in spans:
                _add(_normalize(span))

            results.append(regions)
    except Exception as e:
        logger.warning(f"Batch NER failed: {e}")
        results = [[] for _ in txts]
    return results

def extract_regions_batch(texts: List[str], batch_size: int = 32) -> List[Optional[str]]:
    nlp = _get_pipeline()
    results: List[Optional[str]] = []
    cleaned = [str(t)[:512] if t and str(t).strip() else "" for t in texts]
    total = len(cleaned)

    for i in range(0, total, batch_size):
        batch = cleaned[i:i + batch_size]
        non_empty = [(j, t) for j, t in enumerate(batch) if t]
        batch_results: List[Optional[str]] = [None] * len(batch)
        if non_empty:
            indices, txts = zip(*non_empty)
            for idx, regs in zip(indices, _process_batch(nlp, list(txts))):
                batch_results[idx] = regs[0] if regs else None
        results.extend(batch_results)
        done = min(i + batch_size, total)
        if done % 500 == 0 or done == total:
            print(f"  [{done}/{total}] rows processed...")

    return results

def extract_all_regions_batch(texts: List[str], batch_size: int = 32) -> List[List[str]]:
    nlp = _get_pipeline()
    results: List[List[str]] = []
    cleaned = [str(t)[:512] if t and str(t).strip() else "" for t in texts]
    total = len(cleaned)

    for i in range(0, total, batch_size):
        batch = cleaned[i:i + batch_size]
        non_empty = [(j, t) for j, t in enumerate(batch) if t]
        batch_results: List[List[str]] = [[] for _ in batch]
        if non_empty:
            indices, txts = zip(*non_empty)
            for idx, regs in zip(indices, _process_batch(nlp, list(txts))):
                batch_results[idx] = regs
        results.extend(batch_results)
        done = min(i + batch_size, total)
        if done % 500 == 0 or done == total:
            print(f"  [{done}/{total}] rows processed...")

    return results