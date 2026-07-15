<script setup lang="ts">
import { computed } from 'vue'
import { NPagination } from 'naive-ui'

const props = defineProps<{
  page: number
  pageSize?: number
  pageCount?: number
  itemCount?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const paginationProps = computed(() => {
  const result: Record<string, unknown> = {
    page: props.page,
    disabled: props.disabled ?? false,
    'onUpdate:page': (page: number) => emit('update:page', page),
  }
  if (props.pageSize !== undefined) result.pageSize = props.pageSize
  if (props.pageCount !== undefined) result.pageCount = props.pageCount
  if (props.itemCount !== undefined) result.itemCount = props.itemCount
  return result
})
</script>

<template>
  <NPagination v-bind="paginationProps" />
</template>
