# hono-ssr-react

- [hono-ssr-react](packages/hono-ssr-react/README.md)  
  Simple React SSR
- [hono-ssr-react-routing](packages/hono-ssr-react-routing/README.md)  
  React SSR with routing

React の renderToReadableStream はコンポーネント内の非同期処理を待ってくれるので、コンポーネント内で非同期処理を書いて SSR することが出来ます。ServerComponents や loader 的な構造は不要です。こちらの方が圧倒的に楽なはずなのですが、何故かだれもやっていません。
