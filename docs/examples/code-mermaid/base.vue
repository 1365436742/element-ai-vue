<template>
  <div style="margin-top: 5px">
    <ElACodeMermaid :content="content"></ElACodeMermaid>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElACodeMermaid } from 'element-ai-vue'

const content = ref(`flowchart TD
    A[用户访问注册页面] --> B{输入注册信息}
    B -->|信息完整| C[后端验证信息合法性]
    B -->|信息缺失| D[提示用户补充必填项]
    D --> B
    C -->|验证通过| E[发送验证邮件/短信]
    C -->|验证失败| F[提示错误原因（如手机号已注册）]
    F --> B
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
`)
</script>
