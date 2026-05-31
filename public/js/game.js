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
    const guaranteedPrizes = {3: 1000, 8: 40000};

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

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

    function showGameOverScreen(message, prize) {
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

    function usePhoneLifeline() {
        if (phoneButton.classList.contains('used')) {
            return;
        }
        phoneButton.classList.add('used');

        setTimeout(() => {
            const ringSound = new Audio('../public/content/ring.mp3');
            ringSound.play();

            setTimeout(() => {
                const displayArea = document.createElement('div');
                displayArea.id = 'lifeline-display-area';

                const phoneImg = document.createElement('img');
                phoneImg.id = 'phone-image';
                phoneImg.src = '../public/content/telefonDoDziekana.jpg';

                displayArea.appendChild(phoneImg);
                document.getElementById('game-board').appendChild(displayArea);

                setTimeout(() => {
                    phoneImg.remove();

                    const messageBox = document.createElement('div');
                    messageBox.id = 'dean-message-box';

                    const avatar = document.createElement('img');
                    avatar.id = 'dean-avatar';
                    avatar.src = '../public/content/prodziekan.jpg';

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

                }, 2000);

            }, 500);

        }, 2000);
    }

    function useStreetPollLifeline() {
        if (audienceButton.classList.contains('used')) {
            return;
        }
        audienceButton.classList.add('used');

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

    function useSwitchQuestion() {
        if (switchButton.classList.contains('used')) {
            return;
        }
        switchButton.classList.add('used');

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
                displayQuestion();
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
            // No new questions available, maybe show a message
            switchButton.classList.remove('used'); // Re-enable button if no switch happened
        }
    }

    function handleResign() {
        const existingDialog = document.getElementById('resign-confirm-dialog');
        if (existingDialog) {
            existingDialog.remove();
            return;
        }
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
        btnNo.onclick = () => dialog.remove();
        dialog.appendChild(text);
        dialog.appendChild(btnYes);
        dialog.appendChild(btnNo);
        document.body.appendChild(dialog);
    }

    function useFiftyFifty() {
        if (fiftyFiftyButton.classList.contains('used')) {
            return;
        }
        const currentQuestion = questions[currentQuestionIndex];
        const incorrectAnswers = [];
        answerButtons.forEach((button, index) => {
            if (index !== currentQuestion.correctAnswer) {
                incorrectAnswers.push(button);
            }
        });
        shuffleArray(incorrectAnswers);
        incorrectAnswers.slice(0, 2).forEach(button => button.style.visibility = 'hidden');
        fiftyFiftyButton.classList.add('used');
    }

    function clearLifelineDisplays() {
        const lifelineArea = document.getElementById('lifeline-display-area');
        if (lifelineArea) {
            lifelineArea.remove();
        }
    }

    function displayQuestion() {
        clearLifelineDisplays();
        if (currentQuestionIndex >= questions.length) {
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
    }

    function handleAnswerClick(event) {
        clearLifelineDisplays();
        const selectedButton = event.target;
        const selectedAnswerIndex = parseInt(selectedButton.dataset.index, 10);
        const currentQuestion = questions[currentQuestionIndex];
        selectedButton.classList.add('selected');
        answerButtons.forEach(btn => btn.disabled = true);
        resignButton.disabled = true;
        setTimeout(() => {
            if (selectedAnswerIndex === currentQuestion.correctAnswer) {
                selectedButton.classList.add('correct');
                setTimeout(() => {
                    currentQuestionIndex++;
                    displayQuestion();
                    resignButton.disabled = false;
                }, 2000);
            } else {
                selectedButton.classList.add('incorrect');
                const correctButton = document.querySelector(`[data-index="${currentQuestion.correctAnswer}"]`);
                correctButton.classList.add('correct');
                let finalPrize = 0;
                if (currentQuestionIndex >= 9) {
                    finalPrize = guaranteedPrizes[8];
                } else if (currentQuestionIndex >= 4) {
                    finalPrize = guaranteedPrizes[3];
                }
                setTimeout(() => showGameOverScreen("Niestety, to zła odpowiedź.", finalPrize), 3000);
            }
        }, 1500);
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
    }
});