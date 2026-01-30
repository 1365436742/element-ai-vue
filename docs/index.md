---
layout: false
---

<script setup>
import { onBeforeMount } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
onBeforeMount(() => {
  router.go('/zh/')
})
</script>
