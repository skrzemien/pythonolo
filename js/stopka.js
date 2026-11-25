/* Guzik „Zacznij od nowa" w stopce — jest na każdej podstronie, więc jego
   obsługa siedzi w jednym miejscu. */

import { Postep } from './progress.js';

const PYTANIE = 'Czy wyzerować zapisany postęp zadań?\n\n'
    + 'Zaliczenia zadań na tym urządzeniu zostaną usunięte. '
    + 'Tej operacji nie można cofnąć.';

export function podepnijWyczyszczeniePostepu() {
    const przycisk = document.getElementById('wyczysc-postep');
    if (!przycisk) return;

    przycisk.addEventListener('click', () => {
        if (!confirm(PYTANIE)) return;
        Postep.wyczysc();
        // Strona główna pokaże wyzerowane paski, podstrony — odznaczone zadania.
        location.reload();
    });
}
