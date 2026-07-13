<script setup lang="ts">
import RouteHeader from '@/features/product-api/components/RouteHeader.vue'
import { useAuthStore } from '@/stores'

const auth = useAuthStore()
</script>

<template>
  <main class="product-route">
    <RouteHeader title="认证说明" subtitle="当前不收集登录凭据" />

    <section class="login-surface" aria-labelledby="login-title">
      <div class="login-notice" role="status">
        <h2 id="login-title">登录暂不可用</h2>
        <p>{{ auth.unavailableMessage }}</p>
        <p>公开赛事合同已确认，但当前部署尚未获得跨域权限；受保护回放同样保持不可用。</p>
        <RouterLink :to="{ name: 'competitions' }">返回赛事</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.product-route {
  display: flex;
  flex-direction: column;
  min-height: var(--workspace-viewport-h);
  background: var(--bg);
  color: var(--text);
}

.login-surface {
  display: grid;
  flex: 1 1 auto;
  place-items: start center;
  min-height: 0;
  padding: var(--s-8) var(--s-5);
  overflow: auto;
}

.login-notice {
  display: grid;
  gap: var(--s-4);
  width: min(100%, 560px);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.login-notice h2,
.login-notice p {
  margin: 0;
}

.login-notice h2 {
  font-size: var(--fs-lg);
}

.login-notice p {
  color: var(--text-muted);
}

.login-notice a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  min-height: var(--control-h);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
}

@media (pointer: coarse), (width <= 1024px) {
  .login-notice a {
    min-height: var(--board-touch-target-min);
  }
}
</style>
