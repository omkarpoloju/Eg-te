const CACHE_NAME = 'spoken-english-telugu-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/common.js',
    '/js/serviceWorkerRegistration.js',
    '/manifest.json',

    // Pages
    '/pages/nouns.html',
    '/pages/pronouns.html',
    '/pages/verbs.html',
    '/pages/adjectives.html',
    '/pages/adverbs.html',
    '/pages/prepositions.html',
    '/pages/conjunctions.html',
    '/pages/interjections.html',
    '/pages/articles.html',
    '/pages/dictionary.html',
    '/pages/helping-verbs-can.html',
    '/pages/helping-verbs-could.html',
    '/pages/helping-verbs-may.html',
    '/pages/helping-verbs-might.html',
    '/pages/helping-verbs-must.html',
    '/pages/helping-verbs-should.html',
    '/pages/helping-verbs-would.html',
    '/pages/helping-verbs-have-to.html',
    '/pages/helping-verbs-will-have-to.html',
    '/pages/quizzes.html',
    '/pages/games.html',

    // Data - Parts of Speech
    '/data/parts_of_speech/nouns.json',
    '/data/parts_of_speech/pronouns.json',
    '/data/parts_of_speech/verbs.json',
    '/data/parts_of_speech/adjectives.json',
    '/data/parts_of_speech/adverbs.json',
    '/data/parts_of_speech/prepositions.json',
    '/data/parts_of_speech/conjunctions.json',
    '/data/parts_of_speech/interjections.json',
    '/data/parts_of_speech/articles.json',

    // Data - Helping Verbs
    '/data/helping_verbs/can.json',
    '/data/helping_verbs/could.json',
    '/data/helping_verbs/may.json',
    '/data/helping_verbs/might.json',
    '/data/helping_verbs/must.json',
    '/data/helping_verbs/should.json',
    '/data/helping_verbs/would.json',
    '/data/helping_verbs/have_to.json',
    '/data/helping_verbs/will_have_to.json',

    // Data - Verbs
    '/data/verbs.json',
    '/data/quizzes.json',
    '/data/games.json',

    // Data - Dictionary
    '/data/dictionary/dict_a.json',
    '/data/dictionary/dict_b.json',
    '/data/dictionary/dict_c.json',
    '/data/dictionary/dict_d.json',
    '/data/dictionary/dict_e.json',
    '/data/dictionary/dict_f.json',
    '/data/dictionary/dict_g.json',
    '/data/dictionary/dict_h.json',
    '/data/dictionary/dict_i.json',
    '/data/dictionary/dict_j.json',
    '/data/dictionary/dict_k.json',
    '/data/dictionary/dict_l.json',
    '/data/dictionary/dict_m.json',
    '/data/dictionary/dict_n.json',
    '/data/dictionary/dict_o.json',
    '/data/dictionary/dict_p.json',
    '/data/dictionary/dict_q.json',
    '/data/dictionary/dict_r.json',
    '/data/dictionary/dict_s.json',
    '/data/dictionary/dict_t.json',
    '/data/dictionary/dict_u.json',
    '/data/dictionary/dict_v.json',
    '/data/dictionary/dict_w.json',
    '/data/dictionary/dict_x.json',
    '/data/dictionary/dict_y.json',
    '/data/dictionary/dict_z.json'
];

// Install a service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Cache and return requests
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Update a service worker
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
