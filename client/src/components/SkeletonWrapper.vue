<template>
  <div class="skeleton-wrapper">
    <slot />
  </div>
</template>

<script setup>
defineOptions({ name: 'SkeletonWrapper' })
</script>

<style scoped>
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
