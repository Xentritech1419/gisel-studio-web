const CONFIG = {
  brand: {
    name: 'Gisel Studio de Belleza',
    city: 'Posadas',
    tagline: 'Belleza con identidad propia'
  },
  socials: {
    instagram: 'https://www.instagram.com/estetica.el.fenix/',
    tiktok: 'https://www.tiktok.com/@esttica.el.fnix',
    facebook: 'https://www.facebook.com/esteticaelfenix1',
    maps: 'https://maps.app.goo.gl/1TJaywd2Gwg5gGoN6'
  },
  whatsapp: {
    number: '5493764885801',
    general: 'Hola Gisel Studio de Belleza, quisiera hacer una consulta.',
    turnos: 'Hola Gisel Studio de Belleza, quisiera consultar turnos disponibles.',
    catalogo: 'Hola Gisel Studio de Belleza, quisiera consultar por el servicio ',
    combo: 'Hola Gisel Studio de Belleza, quisiera consultar por el combo '
  }
};

function waLink(message) {
  return `https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-wa="general"]').forEach((btn) => btn.href = waLink(CONFIG.whatsapp.general));
  document.querySelectorAll('[data-wa="turnos"]').forEach((btn) => btn.href = waLink(CONFIG.whatsapp.turnos));
  document.querySelectorAll('[data-service]').forEach((btn) => {
    btn.href = waLink(CONFIG.whatsapp.catalogo + btn.dataset.service + '.');
  });
  document.querySelectorAll('[data-combo]').forEach((btn) => {
    btn.href = waLink(CONFIG.whatsapp.combo + btn.dataset.combo + '.');
  });
});
