import { $, $components } from '../../../src'
import { IconComponents } from './icons/IconComponents'
import { IconMinimal } from './icons/IconMinimal'
import { IconRender } from './icons/IconRender'
import { IconRouter } from './icons/IconRouter'
import { IconSignal } from './icons/IconSignal'
import { WelcomeItem } from './WelcomeItem'

export const TheWelcome = $components(() =>
  $.div([
    WelcomeItem({ $props: { heading: '响应式', icon: IconSignal() } }, [
      '基于 ',
      $.a(
        { href: 'https://github.com/ryyppy/alien-signals', target: '_blank', rel: 'noopener' },
        'alien-signals',
      ),
      ' 的信号系统：',
      $.code('signal'),
      ' 与 ',
      $.code('deepsignal'),
      ' 都能细粒度到属性级，只有真正依赖的 DOM 属性会重新写入。',
    ]),
    WelcomeItem({ $props: { heading: '渲染', icon: IconRender() } }, [
      $.code('$'),
      ' 代理直接创建真实 DOM，没有虚拟 DOM 与 diff。动态子节点与动态属性各自独立订阅，更新互不干扰。',
    ]),
    WelcomeItem({ $props: { heading: '组件', icon: IconComponents() } }, [
      $.code('$components'),
      ' 以统一签名组合组件，',
      $.code('onMounted / onClean'),
      ' 管理生命周期，组件卸载时自动清理副作用。',
    ]),
    WelcomeItem({ $props: { heading: '路由', icon: IconRouter() } }, [
      '内置极简路由：',
      $.code('createRouter'),
      ' 编译路径模式，',
      $.code('RouterView'),
      ' 渲染命中页面，',
      $.code('RouterLink'),
      ' 拦截跳转，',
      $.code('useParams / useQuery'),
      ' 读取动态参数与查询。',
    ]),
    WelcomeItem({ $props: { heading: '极简', icon: IconMinimal() } }, [
      '核心代码只有几百行，运行时仅依赖 ',
      $.a(
        { href: 'https://github.com/ryyppy/alien-signals', target: '_blank', rel: 'noopener' },
        'alien-signals',
      ),
      '，使用 ',
      $.a({ href: 'https://tsdown.dev/', target: '_blank', rel: 'noopener' }, 'tsdown'),
      ' 即可打包发布。',
    ]),
  ]),
)
