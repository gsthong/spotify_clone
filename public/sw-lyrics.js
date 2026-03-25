self.addEventListener('message', (event) => {
  if (event.data.type === 'updateLyric') {
    self.registration.showNotification('VIBE MUSIC', {
      body: event.data.lyric,
      icon: event.data.albumArt,
      tag: 'vibe-lyric',
      silent: true,
      actions: [
        { action: 'prev', title: '⏮' },
        { action: 'play', title: '⏸' },
        { action: 'next', title: '⏭' }
      ]
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'play') {
    clients.matchAll().then(c => c[0]?.postMessage({ type: 'toggle' }));
  } else if (event.action === 'next') {
    clients.matchAll().then(c => c[0]?.postMessage({ type: 'next' }));
  } else if (event.action === 'prev') {
    clients.matchAll().then(c => c[0]?.postMessage({ type: 'prev' }));
  } else {
    clients.matchAll().then(c => c[0]?.focus());
  }
});
