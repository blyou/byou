import { $, $components, $css, RouterLink, RouterView } from '../../src'
import style from './App.css?raw'
import logo from './assets/logo.svg'
import { HelloWorld } from './components/HelloWorld'

const scoped = $css(style)

// 对应 App.vue：logo + HelloWorld 问候 + 导航 + RouterView
export const App = $components(() =>
  $.div({ class: ['app-shell', scoped] }, [
    $.header([
      $.img({ class: 'logo', src: logo, alt: 'byou logo', width: 125, height: 125 }),
      $.div({ class: 'wrapper' }, [
        HelloWorld({ $props: { msg: 'byou' } }),
        $.nav([
          RouterLink({ $props: { to: '/' } }, 'Home'),
          RouterLink({ $props: { to: '/about' } }, 'About'),
        ]),
      ]),
    ]),
    RouterView(),
  ]),
)
