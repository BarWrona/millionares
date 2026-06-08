class SeamlessAudioLoop {
    // konstruktor klasy zapętlającej dźwięk bez przerw
    constructor(src, volume = 0.2, overlapTime = 1.5) {
        this.src = src;
        this.volume = volume;
        this.overlapTime = overlapTime;
        this.players = [new Audio(src), new Audio(src)];
        this.currentPlayerIndex = 0;
        this.isPlaying = false;
        this.checkInterval = null;
        this.isMuted = false;

        this.players.forEach(p => {
            p.volume = volume;
        });
    }

    // rozpoczyna odtwarzanie pętli
    play() {
        if (this.isPlaying) return Promise.resolve();
        this.isPlaying = true;

        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.muted = this.isMuted;
        currentPlayer.volume = this.volume;

        const playPromise = currentPlayer.play();

        this.startChecking();
        return playPromise;
    }

    // sprawdza czas odtwarzania i uruchamia kolejny odtwarzacz przed końcem obecnego
    startChecking() {
        if (this.checkInterval) clearInterval(this.checkInterval);

        this.checkInterval = setInterval(() => {
            if (!this.isPlaying) return;

            const currentPlayer = this.players[this.currentPlayerIndex];
            const nextPlayerIndex = 1 - this.currentPlayerIndex;
            const nextPlayer = this.players[nextPlayerIndex];

            if (currentPlayer.duration && currentPlayer.currentTime >= currentPlayer.duration - this.overlapTime) {
                if (nextPlayer.paused) {
                    nextPlayer.currentTime = 0;
                    nextPlayer.volume = 0;
                    nextPlayer.muted = this.isMuted;

                    nextPlayer.play().then(() => {
                        this.crossfade(currentPlayer, nextPlayer);
                        this.currentPlayerIndex = nextPlayerIndex;
                    }).catch(e => console.error("Error playing next loop channel:", e));
                }
            }
        }, 100);
    }

    // wykonuje płynne przejście głośności pomiędzy odtwarzaczami
    crossfade(fromPlayer, toPlayer) {
        const fadeSteps = 15;
        const fadeDuration = this.overlapTime * 1000;
        const stepTime = fadeDuration / fadeSteps;
        let step = 0;

        const fadeInterval = setInterval(() => {
            step++;
            const ratio = step / fadeSteps;

            fromPlayer.volume = Math.max(0, this.volume * (1 - ratio));
            toPlayer.volume = Math.min(this.volume, this.volume * ratio);

            if (step >= fadeSteps) {
                clearInterval(fadeInterval);
                fromPlayer.pause();
                fromPlayer.volume = this.volume;
            }
        }, stepTime);
    }

    // wstrzymuje odtwarzanie wszystkich kanałów
    pause() {
        this.isPlaying = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.players.forEach(p => p.pause());
    }

    // setter wyciszenia
    set muted(value) {
        this.isMuted = value;
        this.players.forEach(p => {
            p.muted = value;
        });
    }

    // getter wyciszenia
    get muted() {
        return this.isMuted;
    }
}

// inicjalizuje ekran zasad gry po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    const rulesList = [
        "Oto zasady gry",
        "Od miliona złotych dzieli cię 15 pytań",
        "Są dwa progi gwarantowane na 1000 oraz 40000 złotych.",
        "W każdej chwili możesz użyć jednego z 4 kół ratunkowych",
        "sonda gdyńska, poproś naszego agenta Tomusia o przeprowadzenie sondy wśród ludzi na ulicach miasta.",
        "50/50 czyli, usuń dwie błędne odpowiedzi",
        "telefon do Dziekana. Możesz zapytać najważniejszą osobę na naszym wydziale, która odpowiedź wydaje mu się poprawna.",
        "zamiana pytania, tu nie ma większej filozofii",
        "Przy każdym pytaniu masz także możliwość się wycofać z kwotą, którą aktualnie masz.",
        "Nawet student w piątkowy wieczór zrozumie te proste zasady.",
        "Czy jesteś gotowy, aby rozpocząć?"
    ];

    const rulesTextElement = document.getElementById('rules-text');
    const nextButton = document.getElementById('next-rule-btn');
    let currentRuleIndex = 0;
    const backgroundAudio = new SeamlessAudioLoop('../public/content/rules/rules_background.mp3', 0.2, 1.5);
    let currentRuleAudio = null;
    let introAudio = null;

    let isMuted = sessionStorage.getItem('isMuted') === 'true';
    backgroundAudio.muted = isMuted;

    // próbuje odtworzyć muzykę w tle zasad
    function tryPlayBackgroundAudio() {
        backgroundAudio.play().then(() => {
            document.removeEventListener('click', tryPlayBackgroundAudio);
            nextButton.removeEventListener('click', tryPlayBackgroundAudio);
        }).catch(error => {
            console.log("Autoplay blocked background music. Waiting for user interaction...", error);
            document.addEventListener('click', tryPlayBackgroundAudio, { once: true });
        });
    }

    tryPlayBackgroundAudio();

    // odtwarza głosowe wprowadzenie do gry Hyli
    function playIntroduction() {
        introAudio = new Audio('../public/content/rules/introduction.m4a');
        introAudio.volume = 1.0;
        introAudio.muted = isMuted;

        nextButton.style.display = 'none';

        introAudio.addEventListener('ended', () => {
            nextButton.style.display = 'block';
        });

        introAudio.addEventListener('error', (e) => {
            console.error("Failed to play introduction audio:", e);
            nextButton.style.display = 'block';
        });

        introAudio.play().then(() => {
            if (isMuted) {
                nextButton.style.display = 'block';
            }
        }).catch(error => {
            console.log("Autoplay blocked introduction audio:", error);
            nextButton.style.display = 'block';
        });
    }

    playIntroduction();

    // reaguje na zmianę wyciszenia
    window.addEventListener('muteChanged', (e) => {
        isMuted = e.detail.isMuted;
        if (backgroundAudio) {
            backgroundAudio.muted = isMuted;
        }
        if (currentRuleAudio) {
            currentRuleAudio.muted = isMuted;
        }
        if (introAudio) {
            introAudio.muted = isMuted;
            if (isMuted) {
                nextButton.style.display = 'block';
            }
        }
    });

    // wyświetla kolejną zasadę gry i odtwarza do niej dźwięk
    function showNextRule() {
        if (introAudio) {
            introAudio.pause();
            introAudio = null;
        }
        if (currentRuleAudio) {
            currentRuleAudio.pause();
            currentRuleAudio = null;
        }

        if (currentRuleIndex >= rulesList.length) {
            if (backgroundAudio) {
                backgroundAudio.pause();
            }
            window.location.href = 'game.html';
            return;
        }

        nextButton.style.display = 'none';

        const ruleItem = document.createElement('li');
        ruleItem.textContent = rulesList[currentRuleIndex];
        rulesTextElement.appendChild(ruleItem);
        void ruleItem.offsetWidth;
        ruleItem.classList.add('visible');

        currentRuleAudio = new Audio(`../public/content/rules/rule${currentRuleIndex}.m4a`);
        currentRuleAudio.volume = 1;
        currentRuleAudio.muted = isMuted;

        currentRuleAudio.addEventListener('ended', () => {
            nextButton.style.display = 'block';
        });

        currentRuleAudio.addEventListener('error', (e) => {
            console.error(`Could not load audio file: ${currentRuleAudio.src}`, e);
            nextButton.style.display = 'block';
        });

        currentRuleAudio.play().then(() => {
            if (isMuted) {
                nextButton.style.display = 'block';
            }
        }).catch(error => {
            console.error("Rule audio playback failed:", error);
            nextButton.style.display = 'block';
        });

        currentRuleIndex++;

        if (currentRuleIndex === rulesList.length) {
            nextButton.textContent = "Rozpocznij grę";
        }
    }

    nextButton.addEventListener('click', showNextRule);
});