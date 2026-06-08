// inicjalizuje stronę główną po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    const musicPlayer = document.getElementById('musicPlayer');
    musicPlayer.volume = 0.5;

    let isMuted = sessionStorage.getItem('isMuted') === 'true';
    let greetingAudio = null;

    window.addEventListener('muteChanged', (e) => {
        isMuted = e.detail.isMuted;
        if (greetingAudio) {
            greetingAudio.muted = isMuted;
        }
    });

    const css = `
        #custom-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        }
        #custom-overlay h2 { margin: 15px; }
        #start-btn {
            padding: 20px 40px;
            font-size: 1.5rem;
            color: white;
            background: transparent;
            border: 2px solid white;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s ease;
            margin-top: 20px;
        }
        #start-btn:hover { background: white; color: black; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);

    const overlay = document.createElement('div');
    overlay.id = 'custom-overlay';
    const title = document.createElement('h2');
    title.innerText = 'UWAGA! STRONA ODTWARZA DŹWIĘKI, PRZECHODZĄC DALEJ AKCEPTUJESZ WZGLĘDNIE PRZYJEMNE DOZNANIA DŹWIĘKOWE!';
    const disclaimer = document.createElement('h2');
    disclaimer.innerText = 'HUMOR ZAWARTY W GRZE BYWA NĘDZNY, ALE NIE MA NA CELU NIKOGO URAZIĆ I JEST WYŁĄCZNIE DLA WYWOŁANIA CRINGEu W GRACZU!';
    const button = document.createElement('button');
    button.id = 'start-btn';
    button.innerText = 'CHCĘ WEJŚĆ';

    overlay.appendChild(title);
    overlay.appendChild(disclaimer);
    overlay.appendChild(button);
    document.body.appendChild(overlay);

    // obsługuje kliknięcie przycisku wejścia do gry
    button.addEventListener('click', () => {
        overlay.remove();

        if (musicPlayer && !isMuted) {

            musicPlayer.volume = 0.1;
            musicPlayer.play().catch(error => console.error("Autoplay nadal zablokowany:", error));
        }


        greetingAudio = new Audio('../public/content/index/greeting.mp3');
        greetingAudio.volume = 0.9;
        greetingAudio.muted = isMuted;

        greetingAudio.play().then(() => {

            greetingAudio.addEventListener('ended', () => {
                if (musicPlayer) {
                    fadeVolumeUp(musicPlayer, 0.5, 1000);
                }
            });
        }).catch(error => {
            console.error("Greeting audio playback blocked or failed:", error);

            if (musicPlayer) {
                musicPlayer.volume = 0.5;
            }
        });
    });

    // stopniowo podgłaśnia dźwięk w określonym czasie
    function fadeVolumeUp(audioElement, targetVolume, duration) {
        const startVolume = audioElement.volume;
        const steps = 20;
        const stepTime = duration / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            audioElement.volume = startVolume + (targetVolume - startVolume) * progress;

            if (currentStep >= steps) {
                clearInterval(interval);
                audioElement.volume = targetVolume;
            }
        }, stepTime);
    }
});
