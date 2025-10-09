class HomeService {
  constructor() {
    this.siteName = 'PartyAccess';
  }

  getLandingViewModel() {
    return {
      title: `Bienvenido a ${this.siteName}`,
      hero: this._getHeroData(),
      actions: this._getActions(),
      navigation: this._getNavigation()
    };
  }

  _getHeroData() {
    return {
      headline: 'Productos',
      subheadline: 'Listado de productos en carrusel'
    };
  }

  _getActions() {
    return [
      { href: '#', label: 'Generar cupon', primary: true }
    ];
  }

  _getNavigation() {
    return {
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
    };
  }
}

export default new HomeService();

