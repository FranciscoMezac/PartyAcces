const getLandingViewModel = () => {
  return {
    title: 'Bienvenido a PartyAccess',
    hero: {
      headline: 'Productos',
      subheadline: 'Listado de productos en carrusel'
    },
    actions: [
      { href: '#', label: 'Generar cupon', primary: true },
    ],
    navigation:{
      items: [
        {
          label: 'Inicio',
          href: 'home/index',
          active: true

        },
        {
        label: 'QR', 
        href: '/qr',
        active: false 
        },
        {
          label: 'Usuario', 
          href: '/usuario',
          active: false 
        }

      ]
    }
  };
};

export default {
  getLandingViewModel
};

