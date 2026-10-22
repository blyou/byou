import { createRouter } from '../../src'
import { About } from './pages/about'
import { Index } from './pages/index'
import { NotFound } from './pages/notfound'

// 对应 create-vue 模板的 src/router/index.ts，'*' 为未匹配路由的兜底
createRouter({
  routes: [
    { path: '/', component: Index },
    { path: '/about', component: About },
    { path: '*', component: NotFound },
  ],
})
