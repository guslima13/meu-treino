if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        './service-worker.js',
        { updateViaCache: 'none' }
      );

      await registration.update();

    } catch (err) {
      console.warn('Não foi possível atualizar o aplicativo:', err);
    }
  });
}
