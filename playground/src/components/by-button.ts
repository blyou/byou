import { $, $components, $css, onMounted } from '../../../src'
import style from './by-button.css?raw'

const scoped = $css(style)

export const ByButton = $components(
  (props: { theme?: string; onclick?: (e: MouseEvent) => void }, child) => {
    onMounted(() => {
      console.log('ByButton:onMounted', props, $('button'))
    })
    return $.button({ class: ['by-button', scoped, props.theme], onclick: props.onclick }, child)
  },
)
