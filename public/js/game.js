document.addEventListener('DOMContentLoaded', async () => {
    const questionTextElement = document.getElementById('question-text');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const prizeListElement = document.getElementById('prize-list');
    const resignButton = document.getElementById('resign-btn');
    const fiftyFiftyButton = document.getElementById('lifeline-fifty-fifty');
    const phoneButton = document.getElementById('lifeline-phone');
    const audienceButton = document.getElementById('lifeline-audience');
    const switchButton = document.getElementById('lifeline-switch');
    const questionContainer = document.getElementById('question-container');
    const answersContainer = document.getElementById('answers-container');

    let allQuestions = [];
    let questions = [];
    let currentQuestionIndex = 0;
    const prizeLadder = [
        "100", "200", "500", "1000", "2000", "5000", "10 000", "20 000", "40 000",
        "75 000", "125 000", "250 000", "500 000", "1 000 000"
    ];
    const guaranteedPrizes = { 3: 1000, 9: 40000 };


    //tablica głośności dźwięków
    const volumes = {
        gameStart: 0.5,
        questionsBg: 0.2,
        questionVoice: 1.0,
        selectAnswer: 0.7,
        correctVoice: 1,
        correctSound: 0.6,
        wrongVoice: 1,
        wrongSound: 0.5,
        phoneRing: 0.5,
        betweenQuestions: 0.5,
        lifelines: 1
    };

    let isMuted = sessionStorage.getItem('isMuted') === 'true';
    const gameStartAudio = new Audio('../public/content/game/game_start.mp3');
    gameStartAudio.volume = volumes.gameStart;
    gameStartAudio.muted = isMuted;

    const gameBoard = document.getElementById('game-board');
    const prizeLadderEl = document.getElementById('prize-ladder');
    const loadingContainer = document.getElementById('loading-container');
    const loadingText = document.getElementById('loading-text');
    const progressBar = document.getElementById('progress-bar');
    let interfaceShown = false;
    let currentQuestionAudio = null;
    let questionsBgAudio = null;
    let activeCorrectAudios = [];
    let betweenQuestionsAudio = null;
    let activeLifelineAudio = null;


    //chowa interfejs

    function hideInterface() {
        interfaceShown = false;
        if (gameBoard && prizeLadderEl) {
            gameBoard.style.opacity = '0';
            gameBoard.style.pointerEvents = 'none';
            prizeLadderEl.style.opacity = '0';
            prizeLadderEl.style.pointerEvents = 'none';
        }
    }


    //odtwarza dźwięk pomiędzy pytaniami 
    function playBetweenQuestions(callback) {
        stopQuestionsBgAudio();

        betweenQuestionsAudio = new Audio('../public/content/game/between_questions.m4a');
        betweenQuestionsAudio.volume = volumes.betweenQuestions;
        betweenQuestionsAudio.muted = isMuted;

        let transitionTriggered = false;

        function triggerFadeIn() {
            if (transitionTriggered) return;
            transitionTriggered = true;

            currentQuestionIndex++;
            displayQuestion();
            showInterface();

            if (callback) callback();
        }

        betweenQuestionsAudio.addEventListener('timeupdate', () => {
            if (!transitionTriggered && betweenQuestionsAudio.duration) {

                if (betweenQuestionsAudio.currentTime >= betweenQuestionsAudio.duration - 1.5) {
                    triggerFadeIn();
                }
            }
        });

        betweenQuestionsAudio.addEventListener('ended', () => {
            triggerFadeIn();
        });

        betweenQuestionsAudio.addEventListener('error', (e) => {
            console.error("Error playing between_questions audio:", e);
            triggerFadeIn();
        });

        hideInterface();

        betweenQuestionsAudio.play().then(() => {
            if (isMuted) {
                setTimeout(triggerFadeIn, 1500);
            }
        }).catch(error => {
            console.warn("Autoplay blocked between_questions audio:", error);
            triggerFadeIn();
        });
    }


    //odtwarza muzykę w tle w zależności które jest akutalnie pytanie
    function playQuestionsBgAudio() {
        let expectedSrc = '';
        if (currentQuestionIndex < 4) {
            expectedSrc = '../public/content/game/questions1-4.mp3';
        } else if (currentQuestionIndex >= 4) {
            expectedSrc = '../public/content/game/questions5-14.mp3';
        }

        if (expectedSrc) {
            if (questionsBgAudio && !questionsBgAudio.src.includes(expectedSrc.replace('..', ''))) {
                questionsBgAudio.pause();
                questionsBgAudio = null;
            }
            if (!questionsBgAudio) {
                questionsBgAudio = new Audio(expectedSrc);
                questionsBgAudio.loop = true;
                questionsBgAudio.volume = volumes.questionsBg;
                questionsBgAudio.muted = isMuted;
            }
            if (questionsBgAudio.paused) {
                questionsBgAudio.play().catch(e => console.warn("Background audio play blocked:", e));
            }
        } else {
            stopQuestionsBgAudio();
        }
    }


    //zatrzymuje odtwarzane audio
    function stopQuestionsBgAudio() {
        if (questionsBgAudio) {
            questionsBgAudio.pause();
            questionsBgAudio = null;
        }
    }

    //odtwarza audio z danym pytaniem
    function playQuestionAudio() {
        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }

        const ext = (currentQuestionIndex === 7) ? 'mp3' : 'm4a';
        const soundPath = `../public/content/game/question${currentQuestionIndex + 1}.${ext}`;
        currentQuestionAudio = new Audio(soundPath);
        currentQuestionAudio.volume = volumes.questionVoice;
        currentQuestionAudio.muted = isMuted;

        currentQuestionAudio.play().catch(error => {
            console.warn(`Could not play question audio for index ${currentQuestionIndex + 1}:`, error);
        });
    }


    //pokazuje interfejs
    function showInterface() {
        if (interfaceShown) return;
        interfaceShown = true;

        if (loadingContainer) {
            loadingContainer.style.opacity = '0';
            loadingContainer.style.pointerEvents = 'none';
            setTimeout(() => {
                loadingContainer.style.display = 'none';
            }, 1000);
        }

        if (gameBoard && prizeLadderEl) {
            gameBoard.style.opacity = '1';
            gameBoard.style.pointerEvents = 'auto';
            prizeLadderEl.style.opacity = '1';
            prizeLadderEl.style.pointerEvents = 'auto';
        }

        playQuestionsBgAudio();
        playQuestionAudio();
    }

    gameStartAudio.addEventListener('timeupdate', () => {
        if (gameStartAudio.duration) {
            const targetTime = Math.max(1, gameStartAudio.duration - 3.5);
            const progress = Math.min(100, Math.max(0, (gameStartAudio.currentTime / targetTime) * 100));

            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            if (loadingText) {
                loadingText.textContent = `Ładowanie... ${Math.round(progress)}%`;
            }

            if (!interfaceShown && gameStartAudio.currentTime >= targetTime) {
                showInterface();
            }
        }
    });

    gameStartAudio.addEventListener('ended', () => {
        showInterface();
    });

    window.addEventListener('muteChanged', (e) => {
        isMuted = e.detail.isMuted;
        if (gameStartAudio) {
            gameStartAudio.muted = isMuted;
        }
        if (currentQuestionAudio) {
            currentQuestionAudio.muted = isMuted;
        }
        if (questionsBgAudio) {
            questionsBgAudio.muted = isMuted;
        }
        if (betweenQuestionsAudio) {
            betweenQuestionsAudio.muted = isMuted;
        }
        if (activeLifelineAudio) {
            activeLifelineAudio.muted = isMuted;
        }
        activeCorrectAudios.forEach(audio => {
            audio.muted = isMuted;
        });
    });

    function tryPlayGameStart() {
        gameStartAudio.play().then(() => {
            document.removeEventListener('click', tryPlayGameStart);
        }).catch(error => {
            console.log("Autoplay blocked game start sound. Showing interface immediately.", error);
            document.removeEventListener('click', tryPlayGameStart);
            showInterface();
        });
    }

    tryPlayGameStart();


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }


    //dzieli pytania na w zależności od poziomu trudności 
    async function loadAndPrepareQuestions() {
        try {
            const response = await fetch('../public/data/questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allQuestions = await response.json();
            const easy = allQuestions.filter(q => q.difficulty === 'easy');
            const medium = allQuestions.filter(q => q.difficulty === 'medium');
            const hard = allQuestions.filter(q => q.difficulty === 'hard');
            shuffleArray(easy);
            shuffleArray(medium);
            shuffleArray(hard);
            const gameQuestions = [...easy.slice(0, 4), ...medium.slice(0, 5), ...hard];
            questions = gameQuestions.slice(0, prizeLadder.length);
        } catch (error) {
            console.error("Could not load or prepare questions:", error);
            questionTextElement.textContent = "Błąd ładowania pytań.";
        }
    }


    //zarządza tabelą wygranych
    function updatePrizeLadder() {
        prizeListElement.innerHTML = '';
        prizeLadder.forEach((prize, index) => {
            const li = document.createElement('li');
            li.textContent = `${prize} PLN`;
            if (index === currentQuestionIndex) {
                li.classList.add('current-prize');
            }
            prizeListElement.insertBefore(li, prizeListElement.firstChild);
        });
    }


    //wyświetla ekran po grze
    function showGameOverScreen(message, prize) {
        stopQuestionsBgAudio();
        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }
        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        const messageEl = document.createElement('h1');
        messageEl.innerHTML = `${message}<br>Wygrywasz: ${prize} PLN`;
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Zagraj ponownie';
        restartButton.className = 'menu-btn';
        restartButton.onclick = () => window.location.reload();
        overlay.appendChild(messageEl);
        overlay.appendChild(restartButton);
        document.body.appendChild(overlay);
    }

    function typewriterEffect(element, text, callback) {
        let i = 0;
        element.innerHTML = "";

        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, 50);
            } else if (callback) {
                callback();
            }
        }

        type();
    }


    //użyj koła ratunkowego telefonu
    function usePhoneLifeline() {
        if (phoneButton.classList.contains('used')) {
            return;
        }
        phoneButton.classList.add('used');

        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }

        if (activeLifelineAudio) {
            activeLifelineAudio.pause();
        }
        activeLifelineAudio = new Audio('../public/content/game/telefon_do_dziekana.m4a');
        activeLifelineAudio.volume = volumes.lifelines;
        activeLifelineAudio.muted = isMuted;
        activeLifelineAudio.play().catch(e => console.warn(e));

        setTimeout(() => {
            const ringSound = new Audio('../public/content/game/ring.mp3');
            ringSound.volume = volumes.phoneRing;
            ringSound.muted = isMuted;
            ringSound.play();

            setTimeout(() => {
                const displayArea = document.createElement('div');
                displayArea.id = 'lifeline-display-area';

                const phoneImg = document.createElement('img');
                phoneImg.id = 'phone-image';
                phoneImg.src = '../public/content/game/telefonDoDziekana.jpg';

                displayArea.appendChild(phoneImg);
                document.getElementById('game-board').appendChild(displayArea);

                setTimeout(() => {
                    phoneImg.remove();

                    const messageBox = document.createElement('div');
                    messageBox.id = 'dean-message-box';

                    const avatar = document.createElement('img');
                    avatar.id = 'dean-avatar';
                    avatar.src = '../public/content/game/prodziekan.jpg';

                    const messageText = document.createElement('p');
                    messageText.id = 'dean-message-text';

                    messageBox.appendChild(avatar);
                    messageBox.appendChild(messageText);
                    displayArea.appendChild(messageBox);

                    const currentQuestion = questions[currentQuestionIndex];
                    const answers = ['A', 'B', 'C', 'D'];
                    let deanAnswer;

                    if (Math.random() < 0.8) {
                        deanAnswer = answers[currentQuestion.correctAnswer];
                    } else {
                        const incorrectOptions = answers.filter((ans, index) => index !== currentQuestion.correctAnswer);
                        deanAnswer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
                    }

                    const fullMessage = `Hmmm... no ja kurde nie wiem generalnie, ale jakbym miał strzelać, to bym strzelał w odpowiedź: ${deanAnswer}. Ale głowy nie dam!`;

                    typewriterEffect(messageText, fullMessage, null);

                    if (window.innerWidth < 1024) {
                        setTimeout(() => {
                            const currentMessageBox = document.getElementById('dean-message-box');
                            if (currentMessageBox) {
                                displayArea.classList.add('fade-out');
                                setTimeout(() => {
                                    clearLifelineDisplays();
                                }, 500);
                            }
                        }, 15000);
                    }

                }, 2000);

            }, 500);

        }, 2000);
    }


    //użyj koła ratunkowego sonda
    function useStreetPollLifeline() {
        if (audienceButton.classList.contains('used')) {
            return;
        }
        audienceButton.classList.add('used');

        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }

        if (activeLifelineAudio) {
            activeLifelineAudio.pause();
        }
        activeLifelineAudio = new Audio('../public/content/game/sonda.m4a');
        activeLifelineAudio.volume = volumes.lifelines;
        activeLifelineAudio.muted = isMuted;
        activeLifelineAudio.play().catch(e => console.warn(e));

        const displayArea = document.createElement('div');
        displayArea.id = 'lifeline-display-area';

        const pollContainer = document.createElement('div');
        pollContainer.id = 'audience-poll-container';

        const pollText = document.createElement('p');
        pollText.textContent = "Zapytaliśmy miasta powiatowego Gdynia, co sadzi o tym pytaniu. Oto wyniki:";
        pollContainer.appendChild(pollText);

        const chartContainer = document.createElement('div');
        chartContainer.id = 'chart-container';

        const currentQuestion = questions[currentQuestionIndex];
        const answers = ['A', 'B', 'C', 'D'];
        let percentages = [0, 0, 0, 0];
        const correctAnswerIndex = currentQuestion.correctAnswer;

        if (Math.random() < 0.7) {

            let remainingPercentage = 100;
            const correctAnswerPercentage = 40 + Math.floor(Math.random() * 30);
            percentages[correctAnswerIndex] = correctAnswerPercentage;
            remainingPercentage -= correctAnswerPercentage;

            let otherIndices = [0, 1, 2, 3].filter(i => i !== correctAnswerIndex);
            shuffleArray(otherIndices);

            for (let i = 0; i < 2; i++) {
                const randomPercentage = Math.floor(Math.random() * remainingPercentage);
                percentages[otherIndices[i]] = randomPercentage;
                remainingPercentage -= randomPercentage;
            }
            percentages[otherIndices[2]] = remainingPercentage;

        } else {

            let remainingPercentage = 100;
            for (let i = 0; i < 3; i++) {
                const randomPercentage = Math.floor(Math.random() * (remainingPercentage / 2));
                percentages[i] = randomPercentage;
                remainingPercentage -= randomPercentage;
            }
            percentages[3] = remainingPercentage;
            shuffleArray(percentages);
        }


        answers.forEach((answer, index) => {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'chart-bar-wrapper';

            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.setProperty('--bar-height', `${percentages[index]}%`);
            bar.textContent = `${percentages[index]}%`;

            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = answer;

            barWrapper.appendChild(bar);
            barWrapper.appendChild(label);
            chartContainer.appendChild(barWrapper);
        });

        pollContainer.appendChild(chartContainer);
        displayArea.appendChild(pollContainer);
        document.getElementById('game-board').appendChild(displayArea);
    }


    //użyj koła ratunkowego zamień pytanie
    function useSwitchQuestion() {
        if (switchButton.classList.contains('used')) {
            return;
        }
        switchButton.classList.add('used');

        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }

        if (activeLifelineAudio) {
            activeLifelineAudio.pause();
        }
        activeLifelineAudio = new Audio('../public/content/game/zamiana_pytania.m4a');
        activeLifelineAudio.volume = volumes.lifelines;
        activeLifelineAudio.muted = isMuted;
        activeLifelineAudio.play().catch(e => console.warn(e));

        const currentDifficulty = questions[currentQuestionIndex].difficulty;
        const potentialNewQuestions = allQuestions.filter(q =>
            q.difficulty === currentDifficulty && !questions.includes(q)
        );

        if (potentialNewQuestions.length > 0) {
            const newQuestion = potentialNewQuestions[Math.floor(Math.random() * potentialNewQuestions.length)];
            questions[currentQuestionIndex] = newQuestion;

            questionContainer.classList.add('fade-out');
            answersContainer.classList.add('fade-out');

            setTimeout(() => {
                displayQuestion(false);
                questionContainer.classList.remove('fade-out');
                answersContainer.classList.remove('fade-out');
                questionContainer.classList.add('fade-in');
                answersContainer.classList.add('fade-in');

                setTimeout(() => {
                    questionContainer.classList.remove('fade-in');
                    answersContainer.classList.remove('fade-in');
                }, 500);
            }, 500);
        } else {

            switchButton.classList.remove('used');
        }
    }


    //wycofaj się z gry
    function handleResign() {
        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }
        const existingDialog = document.getElementById('resign-confirm-dialog');
        if (existingDialog) {
            existingDialog.remove();
            return;
        }

        if (activeLifelineAudio) {
            activeLifelineAudio.pause();
        }
        activeLifelineAudio = new Audio('../public/content/game/wycofaj_sie.m4a');
        activeLifelineAudio.volume = volumes.lifelines;
        activeLifelineAudio.muted = isMuted;
        activeLifelineAudio.play().catch(e => console.warn(e));

        const dialog = document.createElement('div');
        dialog.id = 'resign-confirm-dialog';
        const text = document.createElement('p');
        text.textContent = 'Czy na pewno chcesz się wycofać?';
        const btnYes = document.createElement('button');
        btnYes.textContent = 'Tak';
        btnYes.className = 'menu-btn';
        btnYes.onclick = () => {
            const prize = currentQuestionIndex > 0 ? prizeLadder[currentQuestionIndex - 1] : 0;
            showGameOverScreen("Zrezygnowałeś z dalszej gry.", prize);
        };
        const btnNo = document.createElement('button');
        btnNo.textContent = 'Nie';
        btnNo.className = 'menu-btn';
        btnNo.onclick = () => {
            if (activeLifelineAudio) {
                activeLifelineAudio.pause();
                activeLifelineAudio = null;
            }
            dialog.remove();
        };
        dialog.appendChild(text);
        dialog.appendChild(btnYes);
        dialog.appendChild(btnNo);
        document.body.appendChild(dialog);
    }


    //użyj koła ratunkowego 50/50
    function useFiftyFifty() {
        if (fiftyFiftyButton.classList.contains('used')) {
            return;
        }
        fiftyFiftyButton.classList.add('used');

        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }

        if (activeLifelineAudio) {
            activeLifelineAudio.pause();
        }
        activeLifelineAudio = new Audio('../public/content/game/50_50.m4a');
        activeLifelineAudio.volume = volumes.lifelines;
        activeLifelineAudio.muted = isMuted;
        activeLifelineAudio.play().catch(e => console.warn(e));

        const currentQuestion = questions[currentQuestionIndex];
        const incorrectAnswers = [];
        answerButtons.forEach((button, index) => {
            if (index !== currentQuestion.correctAnswer) {
                incorrectAnswers.push(button);
            }
        });
        shuffleArray(incorrectAnswers);
        incorrectAnswers.slice(0, 2).forEach(button => button.style.visibility = 'hidden');
    }

    function clearLifelineDisplays() {
        const lifelineArea = document.getElementById('lifeline-display-area');
        if (lifelineArea) {
            lifelineArea.remove();
        }
    }


    // pokaż pytanie
    function displayQuestion(shouldPlayAudio = true) {
        clearLifelineDisplays();
        if (currentQuestionIndex >= questions.length) {
            stopQuestionsBgAudio();
            showGameOverScreen("Gratulacje!", "1 000 000");
            return;
        }
        const currentQuestion = questions[currentQuestionIndex];
        questionTextElement.textContent = currentQuestion.question;
        const answerKeys = ['A', 'B', 'C', 'D'];
        answerButtons.forEach((button, index) => {
            button.textContent = `${answerKeys[index]}: ${currentQuestion.answers[index]}`;
            button.dataset.index = index;
            button.className = 'answer-btn';
            button.disabled = false;
            button.style.visibility = 'visible';
        });
        updatePrizeLadder();

        if (interfaceShown) {
            if (shouldPlayAudio) {
                playQuestionAudio();
            }
            playQuestionsBgAudio();
        }
    }

    //wybierz odpowiedź
    function handleAnswerClick(event) {
        clearLifelineDisplays();

        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio = null;
        }

        const selectedButton = event.target;
        const selectedAnswerIndex = parseInt(selectedButton.dataset.index, 10);
        const currentQuestion = questions[currentQuestionIndex];
        selectedButton.classList.add('selected');
        answerButtons.forEach(btn => btn.disabled = true);
        resignButton.disabled = true;

        function revealResult() {
            if (selectedAnswerIndex === currentQuestion.correctAnswer) {
                selectedButton.classList.add('correct');

                let correctVoicePath = '';
                let correctSoundPath = 'correct_answer_sound.mp3';
                if (currentQuestionIndex === questions.length - 1) {
                    correctVoicePath = 'wygrana.m4a';
                    correctSoundPath = 'winner.mp3';
                } else if (currentQuestionIndex === 8) {
                    correctVoicePath = 'correct_answer_question8.m4a';
                } else {
                    correctVoicePath = Math.random() < 0.5 ? 'correct_answer.m4a' : 'correct_answer2.m4a';
                }
                const correct1 = new Audio('../public/content/game/' + correctVoicePath);
                const correct2 = new Audio('../public/content/game/' + correctSoundPath);
                correct1.volume = volumes.correctVoice;
                correct1.muted = isMuted;
                correct2.volume = volumes.correctSound;
                correct2.muted = isMuted;

                activeCorrectAudios = [correct1, correct2];

                let audio1Ended = false;
                let audio2Ended = false;
                let proceededToNext = false;

                function checkAndProceed() {
                    if (audio1Ended && audio2Ended && !proceededToNext) {
                        proceededToNext = true;
                        activeCorrectAudios = [];
                        if (currentQuestionIndex === questions.length - 1) {
                            currentQuestionIndex++;
                            displayQuestion();
                        } else if (currentQuestionIndex + 1 >= 4) {
                            playBetweenQuestions(() => {
                                resignButton.disabled = false;
                            });
                        } else {
                            currentQuestionIndex++;
                            displayQuestion();
                            resignButton.disabled = false;
                        }
                    }
                }

                if (isMuted) {
                    setTimeout(() => {
                        proceededToNext = true;
                        activeCorrectAudios = [];
                        if (currentQuestionIndex === questions.length - 1) {
                            currentQuestionIndex++;
                            displayQuestion();
                        } else if (currentQuestionIndex + 1 >= 4) {
                            playBetweenQuestions(() => {
                                resignButton.disabled = false;
                            });
                        } else {
                            currentQuestionIndex++;
                            displayQuestion();
                            resignButton.disabled = false;
                        }
                    }, 1500);
                } else {
                    correct1.addEventListener('ended', () => { audio1Ended = true; checkAndProceed(); });
                    correct2.addEventListener('ended', () => { audio2Ended = true; checkAndProceed(); });
                    correct1.addEventListener('error', () => { audio1Ended = true; checkAndProceed(); });
                    correct2.addEventListener('error', () => { audio2Ended = true; checkAndProceed(); });

                    correct1.play().catch(e => {
                        console.warn("correct1 play error:", e);
                        audio1Ended = true;
                        checkAndProceed();
                    });
                    correct2.play().catch(e => {
                        console.warn("correct2 play error:", e);
                        audio2Ended = true;
                        checkAndProceed();
                    });


                    setTimeout(() => {
                        audio1Ended = true;
                        audio2Ended = true;
                        checkAndProceed();
                    }, 7000);
                }
            } else {
                selectedButton.classList.add('incorrect');
                const correctButton = document.querySelector(`[data-index="${currentQuestion.correctAnswer}"]`);
                if (correctButton) {
                    correctButton.classList.add('correct');
                }

                let wrongVoicePath = '';
                if (currentQuestionIndex >= 9) {
                    wrongVoicePath = 'wrong_answer40k.m4a';
                } else if (currentQuestionIndex >= 4 && currentQuestionIndex < 9) {
                    wrongVoicePath = 'wrong_answer1k.m4a';
                } else {
                    wrongVoicePath = Math.random() < 0.5 ? 'wrong_answer.m4a' : 'wrong_answer2.m4a';
                }
                const wrong1 = new Audio('../public/content/game/' + wrongVoicePath);
                const wrong2 = new Audio('../public/content/game/wrong_answer_sound.mp3');
                wrong1.volume = volumes.wrongVoice;
                wrong1.muted = isMuted;
                wrong2.volume = volumes.wrongSound;
                wrong2.muted = isMuted;
                wrong1.play().catch(e => console.warn(e));
                wrong2.play().catch(e => console.warn(e));

                let finalPrize = 0;
                if (currentQuestionIndex >= 9) {
                    finalPrize = guaranteedPrizes[9];
                } else if (currentQuestionIndex >= 4) {
                    finalPrize = guaranteedPrizes[3];
                }
                setTimeout(() => showGameOverScreen("Niestety, to zła odpowiedź.", finalPrize), 3000);
            }
        }

        const selectPath = currentQuestionIndex < 4
            ? '../public/content/game/select_answer1-4.mp3'
            : '../public/content/game/select_answer5-14.mp3';

        const selectSound = new Audio(selectPath);
        selectSound.volume = volumes.selectAnswer;
        selectSound.muted = isMuted;

        let proceeded = false;
        function proceed() {
            if (proceeded) return;
            proceeded = true;
            revealResult();
        }

        selectSound.addEventListener('ended', proceed);
        selectSound.addEventListener('error', proceed);
        selectSound.play().then(() => {
            setTimeout(proceed, 5000);
        }).catch(error => {
            console.warn("Select answer audio playback blocked or failed:", error);
            proceed();
        });
    }

    await loadAndPrepareQuestions();
    if (questions.length > 0) {
        displayQuestion();
        answerButtons.forEach(button => button.addEventListener('click', handleAnswerClick));
        resignButton.addEventListener('click', handleResign);
        fiftyFiftyButton.addEventListener('click', useFiftyFifty);
        phoneButton.addEventListener('click', usePhoneLifeline);
        audienceButton.addEventListener('click', useStreetPollLifeline);
        switchButton.addEventListener('click', useSwitchQuestion);

        // Obsługa wyskakującej drabinki wygranych na telefonach
        const toggleLadderBtn = document.getElementById('toggle-ladder-btn');
        const prizeListModalWrapper = document.getElementById('prize-list-modal-wrapper');
        if (toggleLadderBtn && prizeListModalWrapper) {
            toggleLadderBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                prizeListModalWrapper.classList.toggle('mobile-visible');
            });
            prizeListModalWrapper.addEventListener('click', () => {
                prizeListModalWrapper.classList.remove('mobile-visible');
            });
            document.addEventListener('click', (e) => {
                if (!prizeListModalWrapper.contains(e.target) && e.target !== toggleLadderBtn) {
                    prizeListModalWrapper.classList.remove('mobile-visible');
                }
            });
        }
    }
});