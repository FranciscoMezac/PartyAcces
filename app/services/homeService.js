const getLandingViewModel = () => {
  return {
    title: 'Bienvenido a PartyAccess',
    hero: {
      headline: 'Gestiona el acceso a tus eventos de forma simple',
      subheadline: 'Control de invitados, check-in en puerta y métricas en tiempo real.'
    },
    actions: [
      { href: '#', label: 'Crear evento', primary: true },
      { href: '#', label: 'Ver eventos' }
    ]
  };
};

export default {
  getLandingViewModel
};

