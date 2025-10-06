const log = (message) => {
  const isDev = window?.ENV?.IS_DEV ?? true;

  if (isDev) {
    console.debug(`[PartyAccess] ${message}`);
  }
};

log('Frontend inicializado');
