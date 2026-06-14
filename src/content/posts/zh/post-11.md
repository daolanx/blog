---
title: "SWR：人狠话不多的 React 数据请求 Hook"
pubDate: 2026-01-30
updatedDate: 2026-01-30
author: "Dax"
tags: ["SWR", "React"]
description: "SWR 实用指南：一个极简的 React 数据请求 Hook，内置缓存、重新验证和请求去重，打造极速 UI。"
---


[SWR](https://swr.vercel.app/) 是一个为 React 打造的现代化数据请求库。它拥有精简的 API，内置了缓存、重新验证（Revalidation）以及请求去重功能。通过一个简单的 React Hook，它就能让你的 UI 保持快速、一致且永远处于最新状态。

![](/images/posts/11/1.webp)



## 一、 同类功能代码量对比
在 React 中请求后端接口并保持全局状态一致性是刚需。我们以获取 **/api/user** 为例，看看不同方案的实现成本。

### 1.1 Fetch + Zustand
需要手动管理 Loading、Error 和数据存储，逻辑较为琐碎。

```javascript
// useUserStore.ts
import { useEffect } from 'react';
import { create } from 'zustand';

expoort const useUserStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  fetchUser: async () => {
    const { user, isLoading } = get();
    if (user || isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/user');
      if (!res.ok) throw new Error('获取用户信息失败');
      const data = await res.json();
      set({ user: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

```
<br/>

```javascript
// UserProfile.tsx

export function UserProfile() {
  const { user, isLoading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading && !user) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  return <div>{user?.name}</div>;
}
```

### 1.2 React Query
功能强大，但配置成本较高。你需要定义 **QueryClient**，包裹 **Provider**，并手动声明 **queryKey**。另外技术文档也比较琐碎。

```javascript
// APIProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      refetchOnWindowFocus: false,
    },
  },
});

export function APIProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

```

<br/>

```javascript

// useUser.tsx
import { useQuery } from '@tanstack/react-query';

const fetchUser = async () => {
  const response = await fetch('/api/user');
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });
}

```
<br/>

```javascript

// UserProfile.tsx
export function UserProfile() {
  const { data: user, isLoading, error } = useUser();

  if (isLoading) return <div>正在加载用户信息...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  return (
    <div>
      <h1>用户信息</h1>
      <p>用户名: {user?.name}</p>
      <p>邮箱: {user?.email}</p>
    </div>
  );
}
```

### 1.3 SWR
极致简洁。

```javascript
// useUser.ts
import useSWR from 'swr';

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function useUser() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);
  
  return {
    user: data,
    isLoading,
    error
  };
}
```
<br/>

```javascript
// UseProfile.tsx

export function UserProfile() {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{user?.name}</div>;
}
```

对比结论： 实现同样的功能，SWR 的心智负担和代码负担最小。虽然 React-Query 功能强大，但对于大部分常规需求，SWR 显得够用且简洁。

## 二、 设计哲学：触达本质
### 2.1 简洁优雅的品位
SWR 的 API 设计恰到好处。这种“少即是多”的设计感，体现了开发者的功底和品位。

### 2.2 URL 作为 Key 的独特设计
- 资源的唯一标识： 在 Zustand 中我们需要手动命名存储变量，在 React Query 中需要维护 queryKey 数组。而 SWR 默认以 URL 作为缓存标识。
- 回归本质： URL 本身就是 **Uniform Resource Locator**。它生来就是资源的唯一标识，做缓存 Key 再合适不过。

## 三、 变更操作：灵活的缓存策略

比起通常的请求库来说，SWR 默认开启了缓存策略。首先不要慌，这个不是心智负担，而是在常见场景下，可以更少代码实现更灵活的数据处理。

从实际使用看，使用 **useSWR** 实现请求查询一般没啥要关注的，需要关注的是使用 **useSWRMutation** 的变更类操作。先了解这两个配置：
- **populateCache**：是否用变更请求的响应结果直接更新本地缓存。
- **revalidate**：操作完成后，是否重新发起一次 GET 请求来校验数据。

### 3.1 重新验证模式 (Revalidate)
- 配置：revalidate: true | populateCache: false
- 过程： PATCH 成功 -> 发起 GET 请求 -> 更新 UI
- 适用：体验有最多的延迟，但最稳妥，适用于后端逻辑复杂的场景。

```javascript
const { trigger, isMutating } = useSWRMutation('/api/user', updateUserFetcher, {

  populateCache: false,

  revalidate: true,
});
```
### 3.2 响应填充模式 (Populate)
- 配置：revalidate: false | populateCache: true
- 过程： PATCH 成功并返回新数据 -> 使用 PATCH 返回的数据更新 UI
- 适用：仅需一次网络往返，兼顾速度和一致性的中庸之选，适合常规操作。

```javascript
function Profile() {
  const { trigger } = useSWRMutation('/api/user', updateUserFetcher, {
    populateCache: true, 
    revalidate: false, 
  });

  return <button onClick={() => trigger({ name: '新名字' })}>快速更新</button>;
}
```

### 3.3 乐观更新 (Optimistic Updates)
- 配置：使用 optimisticData 配置 | populateCache: true | revalidate: false | rollbackOnError: true
- 过程：点击瞬间更新 UI -> 发起 PATCH -> 成功后修正或失败后回滚。
- 适用：更新速度最快，适用于点赞、评论等实时性要求极高的场景。
```javascript
const { trigger, isMutating } = useSWRMutation('/api/user', updateUserFetcher, {
  optimisticData: (currentCache) => ({
    ...currentCache,
    ...currentUser,
    status: 'Saving...'
  }),
  populateCache: true,
  rollbackOnError: true,
  revalidate: false,
});
```

### 3.4 静默提交 (Silent Submission)
- 配置：revalidate: false | populateCache: false
- 过程： 发起删除或更新请求 -> UI 保持不变，不需要更新缓存和验证。
- 适用：删除、埋点记录等不需要反馈在当前 UI 上的操作。

```javascript
const { trigger, isMutating } = useSWRMutation('/api/user', deleteUserFetcher, {
  populateCache: false,
  revalidate: false
});

const handleDelete = async () => {
  if (window.confirm('确定要注销账号吗？')) {
    try {
      await trigger();
      alert('账号已在后台删除（静默模式）。');
    } catch (e) {
      alert('删除失败');
    }
  }
};
```

## 四、 结语
SWR 是一个在简洁和强大取得平衡的 React 数据请求管理 hook，不仅体积小，简单实用，也能在统一资源定位的技术理解上有所帮助。

就请求数据并缓存来说，那些需要繁琐配置 Key 的工具，仅仅把请求 URL 当作获取数据的方式，而 SWR 将其视为资源本身，体现出设计的品位和层次。类似 Unix 重那么多不同的设备终端，都抽象为“文件”来标识；Next.js 巧妙地用文件系统映射 URL。好的设计往往显得简单且更触达本质。
