document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('content-container');
    const jsonPath = document.body.dataset.jsonPath;
    const pageType = document.body.dataset.page;

    if (container && jsonPath) {
        // For content pages like nouns, verbs, etc.
        loadAndRenderContent(jsonPath, container);
    } else if (pageType === 'dictionary') {
        initDictionary();
    } else if (pageType === 'quizzes') {
        initQuizzes();
    } else if (pageType === 'games') {
        initGames();
    }

    // Check if this is the verbs page and if the verb forms should be shown
    const urlParams = new URLSearchParams(window.location.search);
    if (document.body.querySelector('#verb-forms-section') && urlParams.get('show') === 'forms') {
        initVerbForms();
    }

    // Initialize the bilingual toggle on all pages
    initBilingualToggle();
});

function initBilingualToggle() {
    const mainContainer = document.querySelector('main.container');
    if (!mainContainer) return;

    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'bilingual-toggle';
    toggleContainer.innerHTML = `
        <button data-lang="both" class="active">Show Both</button>
        <button data-lang="en">Show English Only</button>
        <button data-lang="tel">Show Telugu Only</button>
    `;

    // Insert the toggle controls at the top of the main container
    mainContainer.prepend(toggleContainer);

    const buttons = toggleContainer.querySelectorAll('button');

    // Apply saved preference on load
    const savedPref = localStorage.getItem('language_preference');
    if (savedPref) {
        document.body.className = savedPref;
        buttons.forEach(btn => btn.classList.remove('active'));
        toggleContainer.querySelector(`[data-lang="${savedPref.replace('hide-','')
            .replace('english','en')
            .replace('telugu','tel')}"]`)?.classList.add('active');
        if (savedPref === '') {
             toggleContainer.querySelector(`[data-lang="both"]`)?.classList.add('active');
        }
    }


    toggleContainer.addEventListener('click', e => {
        if (e.target.tagName !== 'BUTTON') return;

        const lang = e.target.dataset.lang;
        let pref = '';
        if (lang === 'en') {
            pref = 'hide-telugu';
        } else if (lang === 'tel') {
            pref = 'hide-english';
        }

        document.body.className = pref;
        localStorage.setItem('language_preference', pref);

        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    });
}

function initQuizzes() {
    const quizContainer = document.getElementById('quiz-main-container');
    if (!quizContainer) return;

    let allQuizzes = [];

    fetch('../data/quizzes.json')
        .then(response => response.json())
        .then(quizzes => {
            allQuizzes = quizzes;
            renderQuizList(quizzes, quizContainer, allQuizzes);
        })
        .catch(error => {
            console.error('Error loading quizzes:', error);
            quizContainer.innerHTML = '<p class="error">Could not load quizzes.</p>';
        });
}

function renderQuizList(quizzes, container, allQuizzes) {
    container.innerHTML = '<h2>Select a Quiz</h2>';
    const list = document.createElement('div');
    list.className = 'quiz-list';

    quizzes.forEach(quiz => {
        const quizItem = document.createElement('div');
        quizItem.className = 'quiz-list-item';
        quizItem.innerHTML = `
            <h3>${quiz.title}</h3>
            <p class="en">${quiz.description_en}</p>
            <p class="tel">${quiz.description_tel}</p>
        `;
        quizItem.addEventListener('click', () => {
            startQuiz(quiz, container, allQuizzes);
        });
        list.appendChild(quizItem);
    });

    container.appendChild(list);
}

function startQuiz(quiz, container, allQuizzes) {
    let currentQuestionIndex = 0;
    let score = 0;
    const progressKey = `quiz_progress_${quiz.slug}`;

    // Main event listener for the quiz container
    container.addEventListener('click', handleQuizClick);

    function handleQuizClick(e) {
        if (e.target.classList.contains('option-btn')) {
            handleAnswer(e.target);
        }
        if (e.target.id === 'next-btn') {
            currentQuestionIndex++;
            if (currentQuestionIndex < quiz.questions.length) {
                showQuestion(currentQuestionIndex);
            } else {
                finishQuiz();
            }
        }
        if (e.target.id === 'restart-btn') {
            startQuiz(quiz, container, allQuizzes);
        }
        if (e.target.id === 'back-to-list-btn') {
            // clean up the listener before rendering the list
            container.removeEventListener('click', handleQuizClick);
            renderQuizList(allQuizzes, container, allQuizzes);
        }
    }

    function showQuestion(index) {
        const question = quiz.questions[index];
        container.innerHTML = `
            <div class="quiz-question">
                <h3>${quiz.title} (${index + 1} / ${quiz.questions.length})</h3>
                <div class="bilingual-pair">
                    <p class="en">${question.question_en}</p>
                    <p class="tel">${question.question_tel}</p>
                </div>
                <div class="options">
                    ${question.options.map(opt => `<button class="option-btn">${opt}</button>`).join('')}
                </div>
                <p class="feedback" id="feedback"></p>
                <p>Score: <span id="score">${score}</span> / ${quiz.questions.length}</p>
                <button id="next-btn" style="display:none;">Next Question</button>
            </div>
        `;
    }

    function handleAnswer(selectedButton) {
        const question = quiz.questions[currentQuestionIndex];
        const selectedAnswer = selectedButton.innerText;
        const feedbackEl = container.querySelector('#feedback');
        const nextBtn = container.querySelector('#next-btn');

        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.innerText === question.answer) {
                btn.classList.add('correct');
            }
        });

        if (selectedAnswer === question.answer) {
            score++;
            feedbackEl.textContent = 'Correct!';
            feedbackEl.style.color = 'green';
        } else {
            selectedButton.classList.add('incorrect');
            feedbackEl.textContent = `Wrong! The correct answer is: ${question.answer}`;
            feedbackEl.style.color = 'red';
        }

        container.querySelector('#score').textContent = score;
        nextBtn.style.display = 'inline-block';
        if (currentQuestionIndex === quiz.questions.length - 1) {
            nextBtn.textContent = 'Finish Quiz';
        }
    }

    function finishQuiz() {
        localStorage.setItem(progressKey, JSON.stringify({ score: score, total: quiz.questions.length }));
        container.innerHTML = `
            <h2>Quiz Complete!</h2>
            <h3>${quiz.title}</h3>
            <p>Your final score is: <strong>${score} out of ${quiz.questions.length}</strong></p>
            <button id="restart-btn">Try Again</button>
            <button id="back-to-list-btn">Back to Quizzes</button>
        `;
    }

    // Start the first question
    showQuestion(currentQuestionIndex);
}

function initVerbForms() {
    const partOfSpeechContent = document.getElementById('content-container');
    const verbFormsSection = document.getElementById('verb-forms-section');
    const searchInput = document.getElementById('verb-search');
    const tableBody = document.getElementById('verb-table-body');

    if (!verbFormsSection || !searchInput || !tableBody) return;

    // Show the verb forms section and hide the default content
    partOfSpeechContent.style.display = 'none';
    verbFormsSection.style.display = 'block';
    document.getElementById('page-title').textContent = 'Verb Forms (క్రియా రూపాలు)';

    let allVerbs = [];

    fetch('../data/verbs.json')
        .then(response => response.json())
        .then(data => {
            allVerbs = data;
            renderVerbTable(allVerbs, tableBody);
        })
        .catch(error => {
            console.error('Error loading verb data:', error);
            tableBody.innerHTML = '<tr><td colspan="6">Could not load verb data.</td></tr>';
        });

    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredVerbs = allVerbs.filter(verb =>
            verb.base.toLowerCase().includes(searchTerm) ||
            verb.telugu.includes(searchTerm)
        );
        renderVerbTable(filteredVerbs, tableBody);
    });
}

function renderVerbTable(verbs, tableBody) {
    if (verbs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No verbs found.</td></tr>';
        return;
    }

    const html = verbs.map(verb => `
        <tr>
            <td>${verb.base}</td>
            <td>${verb.past}</td>
            <td>${verb.past_participle}</td>
            <td>${verb.present_participle}</td>
            <td>${verb.third_singular}</td>
            <td>${verb.telugu}</td>
        </tr>
    `).join('');
    tableBody.innerHTML = html;
}

let allWords = [];
let dictionaryLoaded = false;

function initDictionary() {
    const searchInput = document.getElementById('dictionary-search');
    const resultsContainer = document.getElementById('dictionary-results');
    const alphabetNav = document.getElementById('alphabet-nav');

    if (!searchInput || !resultsContainer || !alphabetNav) {
        console.error('Dictionary UI elements not found!');
        return;
    }

    // Generate alphabet links
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    alphabetNav.innerHTML = alphabet.map(letter => `<a href="#" data-letter="${letter}">${letter}</a>`).join('');

    // Load all data
    loadAllDictionaryData().then(loadedWords => {
        allWords = loadedWords;
        dictionaryLoaded = true;
        resultsContainer.innerHTML = '<p>Dictionary loaded. Select a letter or start typing to search.</p>';
        // Show words for 'A' by default
        handleLetterClick({ target: alphabetNav.querySelector('a[data-letter="A"]') }, allWords);
    }).catch(error => {
        resultsContainer.innerHTML = '<p class="error">Could not load the dictionary data. Please try again later.</p>';
        console.error(error);
    });

    // Add event listeners
    searchInput.addEventListener('keyup', (e) => {
        if (dictionaryLoaded) {
            handleSearch(e, allWords);
        }
    });

    alphabetNav.addEventListener('click', (e) => {
        e.preventDefault();
        if (dictionaryLoaded && e.target.tagName === 'A') {
            handleLetterClick(e, allWords);
        }
    });
}

function loadAllDictionaryData() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const fetchPromises = alphabet.map(letter => {
        return fetch(`../data/dictionary/dict_${letter}.json`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                // Don't throw an error for missing files, just return empty array
                if (response.status === 404) {
                    return [];
                }
                throw new Error(`Failed to load dict_${letter}.json`);
            })
            .catch(error => {
                console.warn(error.message); // Log missing files as warnings
                return []; // Return empty array on error to not break Promise.all
            });
    });

    return Promise.all(fetchPromises).then(arraysOfWords => {
        // Flatten the array of arrays into a single array
        return [].concat(...arraysOfWords);
    });
}

function handleSearch(event, words) {
    const searchTerm = event.target.value.toLowerCase().trim();
    if (searchTerm.length < 2) {
        document.getElementById('dictionary-results').innerHTML = '<p>Please type at least 2 characters to search.</p>';
        return;
    }
    const filteredWords = words.filter(wordObj => wordObj.word.toLowerCase().startsWith(searchTerm));
    renderDictionaryResults(filteredWords);
}

function handleLetterClick(event, words) {
    const letter = event.target.dataset.letter.toLowerCase();
    const filteredWords = words.filter(wordObj => wordObj.word.toLowerCase().startsWith(letter));
    renderDictionaryResults(filteredWords);

    // Update active state for alphabet nav
    const alphabetNav = document.getElementById('alphabet-nav');
    alphabetNav.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');
}

function renderDictionaryResults(results) {
    const resultsContainer = document.getElementById('dictionary-results');
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No words found.</p>';
        return;
    }

    const html = results.map(word => `
        <article class="dictionary-entry">
            <h3>${word.word} <span class="pos">(${word.part_of_speech})</span></h3>
            <div class="bilingual-pair">
                <p class="en">${word.definition_en}</p>
                <p class="tel">${word.definition_telugu}</p>
            </div>
            ${word.examples && word.examples.length > 0 ? `
                <h4>Example:</h4>
                <div class="bilingual-pair example">
                    <p class="en">${word.examples[0].en}</p>
                    <p class="tel">${word.examples[0].tel}</p>
                </div>
            ` : ''}
        </article>
    `).join('');

    resultsContainer.innerHTML = html;
}

function loadAndRenderContent(jsonPath, container) {
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            renderPage(data, container);
        })
        .catch(error => {
            console.error('Error loading content:', error);
            container.innerHTML = `<p class="error">Sorry, the content could not be loaded. Please check your connection and try again.</p>`;
        });
}

function renderPage(data, container) {
    // Set the main page title from JSON data
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl && data.title) {
        pageTitleEl.textContent = data.title;
    } else if (pageTitleEl && data.verb) {
        // For helping verbs
        pageTitleEl.textContent = data.verb.charAt(0).toUpperCase() + data.verb.slice(1);
    }

    // Check the data structure to decide which renderer to use
    if (data.definition) {
        renderPartOfSpeechPage(data, container);
    } else if (data.uses) {
        renderHelpingVerbPage(data, container);
    }
}

function renderPartOfSpeechPage(data, container) {
    let html = '';
    // Definition Section
    if (data.definition) {
        html += `
            <section class="content-section">
                <h2>Definition (నిర్వచనం)</h2>
                <div class="bilingual-pair">
                    <p class="en">${data.definition.en}</p>
                    <p class="tel">${data.definition.tel}</p>
                </div>
            </section>
        `;
    }
    // Generic Sections (like Types, Rules)
    if (data.sections && data.sections.length > 0) {
        data.sections.forEach(section => {
            html += `
                <section class="content-section">
                    <h2>${section.title}</h2>
                    <div class="bilingual-pair">
                        <p class="en">${section.content_en}</p>
                        <p class="tel">${section.content_tel}</p>
                    </div>
                </section>
            `;
        });
    }
    // Examples Section
    if (data.examples && data.examples.length > 0) {
        html += `
            <section class="content-section">
                <h2>Examples (ఉదాహరణలు)</h2>
                ${data.examples.map(ex => `
                    <div class="bilingual-pair">
                        <p class="en">${ex.en}</p>
                        <p class="tel">${ex.tel}</p>
                    </div>
                `).join('')}
            </section>
        `;
    }
    // Common Mistakes Section
    if (data.mistakes && data.mistakes.length > 0) {
        html += `
            <section class="content-section">
                <h2>Common Mistakes (సాధారణ తప్పులు)</h2>
                ${data.mistakes.map(m => `
                    <div class="bilingual-pair">
                        <p class="en">${m.en}</p>
                        <p class="tel">${m.tel}</p>
                    </div>
                `).join('')}
            </section>
        `;
    }
    // Practice Section
    if (data.practice && data.practice.questions) {
        html += `
            <section class="content-section">
                <h2>${data.practice.title}</h2>
                <div id="practice-container"></div>
            </section>
        `;
    }
    container.innerHTML = html;
    if (data.practice && data.practice.questions) {
        renderPractice(data.practice.questions);
    }
}

function renderHelpingVerbPage(data, container) {
    let html = `
        <section class="content-section">
            <h2>Meaning (అర్థం)</h2>
            <div class="bilingual-pair">
                <p class="en">The helping verb '<strong>${data.verb}</strong>' is used to express various meanings.</p>
                <p class="tel">'<strong>${data.verb}</strong>' అనే సహాయక క్రియ వివిధ అర్థాలను వ్యక్తపరచడానికి ఉపయోగపడుతుంది. (తెలుగు: ${data.telugu})</p>
            </div>
        </section>
    `;

    // Uses Section
    if (data.uses && data.uses.length > 0) {
        html += `
            <section class="content-section">
                <h2>Uses (ఉపయోగాలు)</h2>
                ${data.uses.map(use => `
                    <div class="use-case">
                        <h3>${use.title}</h3>
                        <div class="bilingual-pair">
                            <p class="en">${use.description_en}</p>
                            <p class="tel">${use.description_telugu}</p>
                        </div>
                        <h4>Examples:</h4>
                        ${use.examples.map(ex => `
                            <div class="bilingual-pair example">
                                <p class="en">${ex.en}</p>
                                <p class="tel">${ex.tel}</p>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </section>
        `;
    }

    // Practice Section
    if (data.practice && data.practice.questions) {
        html += `
            <section class="content-section">
                <h2>${data.practice.title}</h2>
                <div id="practice-container"></div>
            </section>
        `;
    }

    container.innerHTML = html;

    if (data.practice && data.practice.questions) {
        renderPractice(data.practice.questions);
    }
}

function renderPractice(questions) {
    const practiceContainer = document.getElementById('practice-container');
    if (!practiceContainer) return;

    let questionsHtml = '';
    questions.forEach((q, index) => {
        questionsHtml += `
            <div class="practice-question" id="question-${index}">
                <div class="bilingual-pair">
                    <p class="en"><strong>Q:</strong> ${q.question_en}</p>
                    <p class="tel">${q.question_tel}</p>
                </div>
                <div class="options">
                    ${q.options.map(opt => `<button class="option-btn" data-question-index="${index}" data-correct-answer="${q.answer}">${opt}</button>`).join('')}
                </div>
                <p class="feedback" id="feedback-${index}"></p>
            </div>
        `;
    });
    practiceContainer.innerHTML = questionsHtml;

    // Add event listeners for the newly created buttons
    practiceContainer.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', handleOptionClick);
    });
}

function handleOptionClick(event) {
    const button = event.target;
    const selectedAnswer = button.innerText;
    const correctAnswer = button.dataset.correctAnswer;
    const questionIndex = button.dataset.questionIndex;
    const feedbackEl = document.getElementById(`feedback-${questionIndex}`);

    const questionBlock = document.getElementById(`question-${questionIndex}`);
    const allOptionButtons = questionBlock.querySelectorAll('.option-btn');

    allOptionButtons.forEach(btn => {
        btn.disabled = true; // Disable all buttons for this question
        if (btn.innerText === correctAnswer) {
            btn.style.backgroundColor = '#28a745'; // Green for correct
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = '#dc3545'; // Red for incorrect
             btn.style.color = 'white';
        }
    });

    if (selectedAnswer === correctAnswer) {
        feedbackEl.innerHTML = `<span style="color:green;">Correct! (సరైనది!)</span>`;
    } else {
        button.style.backgroundColor = '#dc3545'; // Ensure the clicked wrong one is red
        feedbackEl.innerHTML = `<span style="color:red;">Incorrect. The correct answer is '${correctAnswer}'. (తప్పు. సరైన సమాధానం '${correctAnswer}'.)</span>`;
    }
}

function initGames() {
    const gameContainer = document.getElementById('game-main-container');
    if (!gameContainer) return;

    let gameData = {};

    fetch('../data/games.json')
        .then(response => response.json())
        .then(data => {
            gameData = data;
            renderGameList(gameContainer, gameData);
        })
        .catch(error => {
            console.error('Error loading game data:', error);
            gameContainer.innerHTML = '<p class="error">Could not load games.</p>';
        });
}

function renderGameList(container, gameData) {
    container.innerHTML = `
        <h2>Select a Game</h2>
        <div class="game-list">
            <div class="game-list-item" data-game="matching">
                <h3>Matching Game</h3>
                <p class="en">Match the English word with its Telugu meaning.</p>
                <p class="tel">ఆంగ్ల పదాన్ని దాని తెలుగు అర్థంతో జతపరచండి.</p>
            </div>
            <div class="game-list-item" data-game="scramble">
                <h3>Word Scramble</h3>
                <p class="en">Unscramble the letters to form a meaningful word.</p>
                <p class="tel">అర్థవంతమైన పదాన్ని రూపొందించడానికి అక్షరాలను సరిచేయండి.</p>
            </div>
            <div class="game-list-item" data-game="hangman">
                <h3>Hangman</h3>
                <p class="en">Guess the word before the man is hanged!</p>
                <p class="tel">మనిషిని ఉరితీయకముందే పదాన్ని ఊహించండి!</p>
            </div>
        </div>
    `;

    container.querySelector('.game-list').addEventListener('click', e => {
        const gameItem = e.target.closest('.game-list-item');
        if (!gameItem) return;

        const gameType = gameItem.dataset.game;
        if (gameType === 'matching') {
            startMatchingGame(container, gameData.matching, gameData);
        } else {
            container.innerHTML = `<h2>${gameType} - Coming Soon!</h2><button id="back-to-games">Back to Games</button>`;
            container.querySelector('#back-to-games').addEventListener('click', () => renderGameList(container, gameData));
        }
    });
}

function startMatchingGame(container, words, allGameData) {
    // Fisher-Yates shuffle algorithm
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const shuffledWords = shuffle([...words]);
    const enWords = shuffledWords.map(pair => pair[0]);
    const telWords = shuffle(shuffledWords.map(pair => pair[1])); // Shuffle one column independently

    container.innerHTML = `
        <h2>Matching Game</h2>
        <div class="matching-game-container">
            <div class="word-column" id="en-column">
                ${enWords.map((word, i) => `<div class="card" data-word="${word}" data-match-index="${shuffledWords.findIndex(p => p[0] === word)}">${word}</div>`).join('')}
            </div>
            <div class="word-column" id="tel-column">
                ${telWords.map(word => `<div class="card" data-word="${word}" data-match-index="${shuffledWords.findIndex(p => p[1] === word)}">${word}</div>`).join('')}
            </div>
        </div>
        <p id="match-feedback"></p>
        <button id="back-to-games">Back to Games</button>
    `;

    container.querySelector('#back-to-games').addEventListener('click', () => renderGameList(container, allGameData));

    let selectedCards = [];
    let matchedPairs = 0;

    container.querySelector('.matching-game-container').addEventListener('click', e => {
        const card = e.target.closest('.card');
        if (!card || card.classList.contains('matched') || card.classList.contains('selected')) return;

        card.classList.add('selected');
        selectedCards.push(card);

        if (selectedCards.length === 2) {
            const [card1, card2] = selectedCards;
            if (card1.dataset.matchIndex === card2.dataset.matchIndex) {
                // Match!
                card1.classList.add('matched');
                card2.classList.add('matched');
                card1.classList.remove('selected');
                card2.classList.remove('selected');
                matchedPairs++;
                if (matchedPairs === words.length) {
                    container.querySelector('#match-feedback').textContent = 'Congratulations! You matched all the words!';
                    container.querySelector('#match-feedback').style.color = 'green';
                }
            } else {
                // No match
                setTimeout(() => {
                    card1.classList.remove('selected');
                    card2.classList.remove('selected');
                }, 800);
            }
            selectedCards = [];
        }
    });
}
