// ============================================================
//  tour.js — shared guided tour banner
// ============================================================
const TOUR_STORAGE_KEY = 'eduminat.tour.dismissed';

function tourIsDismissed() {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
}

function dismissTour() {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    document.getElementById('tourBanner')?.classList.add('hidden');
}

function resetTour() {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    renderTour();
}

function renderTour() {
    const banner = document.getElementById('tourBanner');
    if (!banner) return;

    // Don't show if dismissed
    if (tourIsDismissed()) {
        banner.classList.add('hidden');
        return;
    }

    // Fill content
    document.getElementById('tourTitle').innerText = window.I18N?.t('tour.title') || 'Welcome';
    document.getElementById('tourBody').innerText = window.I18N?.t('tour.body') || '';
    document.getElementById('tourSteps').innerHTML = [1, 2, 3, 4, 5]
        .map(i => `<li>${window.I18N?.t(`tour.step${i}`) || ''}</li>`)
        .join('');
    document.getElementById('tourDismissBtn').innerText = window.I18N?.t('tour.dismiss') || 'Got it';

    banner.classList.remove('hidden');
}

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', renderTour);

// Re-render on language change
document.addEventListener('languagechange', renderTour);