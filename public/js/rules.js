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
        "Przy każdym pytaniu masz także możliwość się wycofać z kwotą, którą aktualnie masz."
    ];

    const rulesTextElement = document.getElementById('rules-text');
    const nextButton = document.getElementById('next-rule-btn');
    let currentRuleIndex = 0;

    const isMuted = localStorage.getItem('isMuted') === 'true';

    function showNextRule() {
        if (currentRuleIndex >= rulesList.length) {
            window.location.href = 'game.html';
            return;
        }

        nextButton.style.display = 'none';

        const ruleItem = document.createElement('li');
        ruleItem.textContent = rulesList[currentRuleIndex];
        rulesTextElement.appendChild(ruleItem);
        void ruleItem.offsetWidth;
        ruleItem.classList.add('visible');

        if (isMuted) {
            nextButton.style.display = 'block';
        } else {

            const audio = new Audio(`../public/content/rules/rule${currentRuleIndex}.mp3`);

            audio.addEventListener('loadedmetadata', () => {
                const audioDuration = audio.duration * 1000;

                audio.play().catch(error => {
                    console.error("Audio playback failed:", error);
                    nextButton.style.display = 'block';
                });

                setTimeout(() => {
                    nextButton.style.display = 'block';
                }, audioDuration);
            });

            audio.addEventListener('error', (e) => {
                console.error(`Could not load audio file: ${audio.src}`, e);
                nextButton.style.display = 'block';
            });
        }

        currentRuleIndex++;

        if (currentRuleIndex === rulesList.length) {
            nextButton.textContent = "Rozpocznij grę";
        }
    }

    nextButton.addEventListener('click', showNextRule);

    showNextRule();
});
