# [Auto] script for correct region mapping

REGION_FIXES = {
    "Миколаїська область": "Миколаївська область",
    " Невідома": None,
}

REGIONS = {
    "Вінницька область":              (49.2331, 28.4682, "Vinnytsia"),
    "Волинська область":              (50.7472, 25.3254, "Volyn"),
    "Дніпропетровська область":       (48.4647, 35.0462, "Dnipropetrovsk"),
    "Донецька область":               (48.0159, 37.8028, "Donetsk"),
    "Житомирська область":            (50.2547, 28.6587, "Zhytomyr"),
    "Закарпатська область":           (48.6208, 22.2879, "Zakarpattia"),
    "Запорізька область":             (47.8388, 35.1396, "Zaporizhzhia"),
    "Івано-Франківська область":      (48.9226, 24.7111, "Ivano-Frankivsk"),
    "Київська область":               (50.4501, 30.5234, "Kyiv Oblast"),
    "Кіровоградська область":         (48.5132, 32.2597, "Kirovohrad"),
    "Львівська область":              (49.8397, 24.0297, "Lviv"),
    "Миколаївська область":           (46.9750, 31.9946, "Mykolaiv"),
    "Одеська область":                (46.4825, 30.7233, "Odesa"),
    "Полтавська область":             (49.5883, 34.5514, "Poltava"),
    "Рівненська область":             (50.6199, 26.2516, "Rivne"),
    "Сумська область":                (50.9077, 34.7981, "Sumy"),
    "Тернопільська область":          (49.5535, 25.5948, "Ternopil"),
    "Харківська область":             (49.9935, 36.2304, "Kharkiv"),
    "Херсонська область":             (46.6354, 32.6169, "Kherson"),
    "Хмельницька область":            (49.4229, 26.9871, "Khmelnytskyi"),
    "Черкаська область":              (49.4444, 32.0598, "Cherkasy"),
    "Чернівецька область":            (48.2916, 25.9352, "Chernivtsi"),
    "Чернігівська область":           (51.4982, 31.2893, "Chernihiv"),
    "м. Київ":                        (50.4501, 30.5234, "Kyiv City"),
}

NEIGHBORS = {
    "Vinnytsia":       ["Zhytomyr","Kyiv Oblast","Cherkasy","Kirovohrad","Odesa","Khmelnytskyi"],
    "Volyn":           ["Lviv","Rivne","Zhytomyr"],
    "Dnipropetrovsk":  ["Kirovohrad","Poltava","Kharkiv","Donetsk","Zaporizhzhia","Kherson","Mykolaiv"],
    "Donetsk":         ["Kharkiv","Zaporizhzhia","Dnipropetrovsk"],
    "Zhytomyr":        ["Volyn","Rivne","Kyiv Oblast","Vinnytsia","Khmelnytskyi","Chernihiv"],
    "Zakarpattia":     ["Lviv","Ivano-Frankivsk"],
    "Zaporizhzhia":    ["Dnipropetrovsk","Donetsk","Kherson"],
    "Ivano-Frankivsk": ["Lviv","Ternopil","Chernivtsi","Zakarpattia"],
    "Kyiv Oblast":     ["Chernihiv","Poltava","Cherkasy","Vinnytsia","Zhytomyr","Kyiv City"],
    "Kyiv City":       ["Kyiv Oblast"],
    "Kirovohrad":      ["Cherkasy","Poltava","Dnipropetrovsk","Mykolaiv","Odesa","Vinnytsia"],
    "Lviv":            ["Volyn","Rivne","Ternopil","Ivano-Frankivsk","Zakarpattia"],
    "Mykolaiv":        ["Odesa","Kherson","Dnipropetrovsk","Kirovohrad"],
    "Odesa":           ["Mykolaiv","Kirovohrad","Vinnytsia"],
    "Poltava":         ["Sumy","Kharkiv","Dnipropetrovsk","Kirovohrad","Cherkasy","Kyiv Oblast"],
    "Rivne":           ["Volyn","Lviv","Ternopil","Khmelnytskyi","Zhytomyr"],
    "Sumy":            ["Chernihiv","Poltava","Kharkiv"],
    "Ternopil":        ["Lviv","Rivne","Khmelnytskyi","Ivano-Frankivsk","Chernivtsi"],
    "Kharkiv":         ["Sumy","Donetsk","Dnipropetrovsk","Poltava"],
    "Kherson":         ["Mykolaiv","Dnipropetrovsk","Zaporizhzhia"],
    "Khmelnytskyi":    ["Zhytomyr","Rivne","Ternopil","Chernivtsi","Vinnytsia"],
    "Cherkasy":        ["Kyiv Oblast","Poltava","Kirovohrad","Vinnytsia"],
    "Chernivtsi":      ["Ivano-Frankivsk","Ternopil","Khmelnytskyi"],
    "Chernihiv":       ["Kyiv Oblast","Sumy","Zhytomyr"]
}

REGION_NAMES = list(REGIONS.keys())

REGION_RECORDS = [
    {"region": name, "lat": lat, "lon": lon, "region_en": en}
    for name, (lat, lon, en) in REGIONS.items()
]

UA_TO_EN = {ua: en for ua, (_, _, en) in REGIONS.items()}

REGION_LIST = sorted(UA_TO_EN.values())
EN_TO_ID = {en: i for i, en in enumerate(REGION_LIST)}
ID_TO_EN = {i: en for en, i in EN_TO_ID.items()}

REGION_IDS = list(UA_TO_EN.values())

EN_TO_COORDS = {en.replace(" ", "_"): (lat, lon) for ua, (lat, lon, en) in REGIONS.items()}

if __name__ == "__main__":
    import pandas as pd
    df = pd.DataFrame(REGION_RECORDS)
    print(df.to_string(index=False))
    print(f"\nTotal: {len(df)} regions")