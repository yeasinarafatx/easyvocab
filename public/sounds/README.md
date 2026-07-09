# Sound effects

Ei folder-e sound file rakho. App ei 3ta file play kore:

| File | Kokhon baje |
|------|-------------|
| `correct.mp3` | Practice/Exam-e word thik hole (learn typing + speak) |
| `swipe.mp3`   | Flashcard-e Next/Previous page swipe |
| `winner.mp3`  | Wordpack / level complete hole |

## Niyom
- File-er naam thik ei tin-tai hote hobe: `correct.mp3`, `swipe.mp3`, `winner.mp3`.
- Onno format (`.wav`/`.ogg`) use korle `src/lib/sounds.ts`-er `SOUND_FILES` map-e path bodle dao.
- Choto file rakho (< 100KB, 1-2 sec) — druto load hobe.
- File na thakle app crash korbe na, shudhu oi sound baje na.
