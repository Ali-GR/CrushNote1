const BAD_WORDS = [
    // Deutsche Standard-Beleidigungen
    "arsch", "arschloch", "arschgeige", "arschkriecher", "arschgesicht", "arschficker",
    "affe", "affenpimmel", "affenarsch",
    "bastard", "blödmann", "blöde", "blödkopf", "blödsack", "blödian",
    "depp", "dummschwätzer", "dummkopf", "dummbeutel", "dussel", "dummerchen", "dummbatz",
    "drecksack", "drecksau", "drecksstück", "dreckskerl", "dreckstück", "drecksvieh",
    "fotze", "ficker", "fick", "ficken", "fick dich", "fickt euch", "fickstück",
    "hure", "hurensohn", "hurentochter", "hund", "hündin", "hundsfott",
    "idiot", "idiotin", "idiotisch",
    "kacke", "kack", "kacker", "kackbratze", "kackstelze", "kackhaufen",
    "kriecher", "kümmerling",
    "lusche", "lurch", "luser",
    "mist", "miststück", "mistkerl", "mistfink", "mistvieh", "misthund", "mistkäfer",
    "missgeburt", "misgeburt",
    "nutte", "nichtsnutz", "nulpe",
    "pisser", "piss", "pissnelke", "pisskerl", "pissfresse", "pissgesicht",
    "penner", "pfeife", "pflaume",
    "rotznase", "rotzlöffel", "rotz", "rotzig",
    "schlampe", "schlampen",
    "schwein", "schweinehund", "schweinebacke", "saublöd", "saudumm", "sau", "saubacke",
    "scheiße", "scheiss", "scheiß", "schleimscheißer", "schwachkopf", "schwachmat", "schwachmatt",
    "spasti", "spast", "spacken", "spacko", "spack", "spastisch",
    "trottel", "tussi", "tusse", "trottelig",
    "verpiss dich", "verpiss", "vollidiot", "vollpfosten", "volltrottel", "vollhonk",
    "wichser", "wixer", "wixxer", "wichs",
    "ziege", "zicke", "zimtzicke", "zickig",
    // Englische Beleidigungen
    "fuck", "fucking", "fucker", "motherfucker", "bitch", "slut", "whore",
    "shit", "bullshit", "dumbass", "asshole", "asshat", "jackass",
    "pussy", "cock", "cunt", "twat", "wanker", "dickhead",
    // Abkürzungen
    "hdf", "fickdich", "fick_dich", "stfu", "gtfo",
    // Leetspeak
    "4rsch", "4rschloch", "sch3iße", "sch3isse", "f1cker", "f1ck",
    // Jugendsprache / Rassismus / Ableismus
    "opfer", "behindert", "behindi",
    "schwuchtel", "kanake", "kanacke", "kanak",
    "zigeuner", "neger", "bimbo", "krüppel",
    "mong", "mongoid", "retard", "retarded",
    // Extreme Slurs (Sub-string check)
    "nigger", "nigga", "niga", "niggr", "negro", "kanake", "hurensohn", "hure", "wichser", "missgeburt",
];

export const checkWordFilter = (text: string): boolean => {
    // Normalize text: remove common bypasses like extra spaces, dots, or repeated letters
    const normalized = text.toLowerCase()
        .replace(/[.\-_,;+*]/g, '') // remove punctuation bypasses
        .replace(/(.)\1+/g, '$1');   // remove repeated character bypasses

    // 1. Whole word check for general insults
    const escapedGeneral = BAD_WORDS.slice(0, 46).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const generalPattern = new RegExp(`\\b(${escapedGeneral.join('|')})\\b`, 'i');

    if (generalPattern.test(text.toLowerCase())) return true;

    // 2. Substring check for extreme slurs (even if hidden in word)
    const extremeSlurs = [
        "nigger", "nigga", "niga", "negre", "kanak", 
        "hurensohn", "missgeburt", "wichser", "fotze",
        "arschloch", "bastard"
    ];

    const lowerText = text.toLowerCase();
    
    for (const slur of extremeSlurs) {
        // Build a regex that allows repeated characters and optional punctuation
        const fuzzyPattern = slur.split('').map(char => `${char}+[.\\-_,;+*\\s]*`).join('');
        const regex = new RegExp(fuzzyPattern, 'i');
        
        if (regex.test(lowerText) || normalized.includes(slur)) {
            return true;
        }
    }

    return false;
};
