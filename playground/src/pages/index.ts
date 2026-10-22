import { $, $components } from '../../../src'
import { TheWelcome } from '../components/TheWelcome'

// 对应 HomeView.vue
export const Index = $components(() => $.main(TheWelcome()))
