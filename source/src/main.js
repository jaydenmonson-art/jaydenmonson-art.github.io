const toggle = document.querySelector('.nav-toggle')
const nav = document.querySelector('#site-nav')

function setOpen(open) {
  if (!nav || !toggle) return
  nav.classList.toggle('is-open', open)
  toggle.setAttribute('aria-expanded', String(open))
  toggle.textContent = open ? 'Close' : 'Menu'
}

toggle?.addEventListener('click', () => {
  setOpen(toggle.getAttribute('aria-expanded') !== 'true')
})

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setOpen(false))
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setOpen(false)
})
