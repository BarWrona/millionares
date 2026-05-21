document.addEventListener('DOMContentLoaded', () => {
    const musicPlayer = document.getElementById('musicPlayer');

    // --- Overlay Logic ---
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

    button.addEventListener('click', () => {
        overlay.remove();

        const isMuted = sessionStorage.getItem('isMuted') === 'true';
        if (musicPlayer && !isMuted) {
            musicPlayer.play().catch(error => console.error("Autoplay nadal zablokowany:", error));
        }
    });
});
