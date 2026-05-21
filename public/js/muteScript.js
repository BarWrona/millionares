document.addEventListener('DOMContentLoaded', () => {
    const muteIcon = document.getElementById('mute-icon');

    const musicPlayer = document.getElementById('musicPlayer');

    let isMuted = sessionStorage.getItem('isMuted') === 'true';

    function applyMuteState() {
        if (muteIcon) {
            muteIcon.src = isMuted ? '../public/content/icons8-mute-50.png' : '../public/content/icons8-speaker-50.png';
            muteIcon.alt = isMuted ? 'Unmute' : 'Mute';
        }
        if (musicPlayer) {
            musicPlayer.muted = isMuted;
        }

        const ruleAudios = document.querySelectorAll('.rule-audio');
        ruleAudios.forEach(audio => audio.muted = isMuted);
    }

    function toggleMute() {
        isMuted = !isMuted;
        sessionStorage.setItem('isMuted', isMuted);
        applyMuteState();
    }

    if (muteIcon) {
        muteIcon.addEventListener('click', toggleMute);
    }

    applyMuteState();
});
