---
name: create-data-js-1000-sentences
overview: 创建 js/data.js 文件，包含 12 大雅思话题分类定义和 1000 句精选雅思语料库，每句含英文、中文翻译、重点词汇、分类、难度等级和填空位置。
todos:
  - id: create-data-block1
    content: 使用[skill:brainstorming]规划第1块数据：创建 js/data.js 文件，包含 SENTENCE_CATEGORIES 定义 + 前 ~166 句（education 和 environment 分类的真实雅思级别句子，每个句子包含英文原文、中文翻译、重点词汇释义、难度和可选填空位置）
    status: completed
  - id: create-data-block2
    content: 创建第2块数据：在 data.js 末尾追加 technology + society 分类的 ~167 句，验证首块数据的完整性后再追加
    status: completed
    dependencies:
      - create-data-block1
  - id: create-data-block3
    content: 创建第3块数据：在 data.js 末尾追加 health + work 分类的 ~167 句，检查数组语法是否正确
    status: completed
    dependencies:
      - create-data-block2
  - id: create-data-block4
    content: 创建第4块数据：在 data.js 末尾追加 travel + crime 分类的 ~167 句，验证 ID 连续性
    status: completed
    dependencies:
      - create-data-block3
  - id: create-data-block5
    content: 创建第5块数据：在 data.js 末尾追加 media + science 分类的 ~167 句，检查所有句子难度分布是否合理
    status: completed
    dependencies:
      - create-data-block4
  - id: create-data-block6
    content: 创建第6块数据：在 data.js 末尾追加 business + arts 分类的 ~166 句，完成全部 1000 句
    status: completed
    dependencies:
      - create-data-block5
  - id: verify-and-test
    content: 使用[skill:code-analyzer]完整性校验：确认 DATA.length===1000、ID连续无重复、所有分类句数均衡、无语法错误；在浏览器中打开 index.html 进行功能测试
    status: completed
    dependencies:
      - create-data-block6
  - id: deploy-to-github
    content: 使用[GitHub MCP]创建仓库并推送完整项目代码
    status: completed
    dependencies:
      - verify-and-test
---

## 项目概述

雅思1000句语境学习Web应用。所有功能模块已实现完毕（仪表盘、卡片模式、填空模式、听写模式、错题本、词汇本、设置），唯一缺失的是核心数据文件 `js/data.js`。

## 核心任务

创建 `js/data.js` 文件，包含：

1. **12大雅思话题分类定义**（SENTENCE_CATEGORIES）：教育、环境、科技、社会文化、健康、工作、旅行、犯罪法律、媒体、科研、经济商业、艺术娱乐
2. **1000句雅思精选语料库**（DATA数组）：每句包含英文原文、中文翻译、重点词汇（2-4个）、分类标签、难度等级（1-5）、可选填空位置索引
3. 数据量约 300-500KB，需分块创建

## 技术栈

- **无需额外技术**：纯 JS 数据文件，零依赖
- **数据格式**：JSON 结构硬编码在 JS 中，通过 `const DATA = [...]` 全局变量暴露

## 数据结构设计

### SENTENCE_CATEGORIES 定义

```js
const SENTENCE_CATEGORIES = [
  { id: 'education',    label: '教育',     color: '#3B82F6' },
  { id: 'environment',  label: '环境',     color: '#10B981' },
  { id: 'technology',   label: '科技',     color: '#8B5CF6' },
  { id: 'society',      label: '社会文化', color: '#F59E0B' },
  { id: 'health',       label: '健康',     color: '#EF4444' },
  { id: 'work',         label: '工作',     color: '#6366F1' },
  { id: 'travel',       label: '旅行',     color: '#14B8A6' },
  { id: 'crime',        label: '犯罪法律', color: '#F97316' },
  { id: 'media',        label: '媒体',     color: '#EC4899' },
  { id: 'science',      label: '科研',     color: '#06B6D4' },
  { id: 'business',     label: '经济商业', color: '#84CC16' },
  { id: 'arts',         label: '艺术娱乐', color: '#E11D48' }
];
```

### 单句数据结构

```js
{
  id: "s001",            // 唯一ID，格式 "s" + 三位序号
  en: "...",             // 英文原文
  zh: "...",             // 中文翻译
  vocab: [               // 重点词汇 (2-4个)
    { word: "analyze", meaning: "分析" },
    { word: "comprehensive", meaning: "全面的" }
  ],
  category: "education", // 对应 SENTENCE_CATEGORIES id
  difficulty: 3,         // 难度 1-5
  blankWord: 0           // 可选，指向 vocab 数组索引，填空模式使用
}
```

### 每类分布

- 12 个分类，每个约 83-84 句
- 约 1/3 的句子设置 blankWord（填空位置）
- 难度分布：1级10%、2级20%、3级40%、4级20%、5级10%

## 分块策略

由于 1000 句数据量巨大，分 7 块逐步创建。首块包含 SENTENCE_CATEGORIES 定义+前2个分类（约170句），后续每块约 2 个分类。

| 块号 | 分类 | 句数 | 累计 |
| --- | --- | --- | --- |
| 1 (首块) | education + environment | ~166 | ~166 |
| 2 | technology + society | ~167 | ~333 |
| 3 | health + work | ~167 | ~500 |
| 4 | travel + crime | ~167 | ~667 |
| 5 | media + science | ~167 | ~834 |
| 6 | business + arts | ~166 | ~1000 |
| 7 | 完整性校验 + 最终测试 | - | 1000 |


## 使用的扩展

### Skills

- **[skill:brainstorming]**: 在确定 12 大分类的句子主题分布和难度梯度时使用，确保覆盖雅思常考话题的所有子话题，输出最优的语料分布方案
- **[skill:humanizer-zh]**: 在编写中文翻译和词汇释义时使用，使中文表达更自然、更符合雅思学习场景
- **[skill:code-analyzer]**: 在最终完整性校验步骤中，用于分析 data.js 的代码复杂度、检测数据完整性（1000条是否齐全、ID是否连续）

### SubAgent

- **[subagent:code-explorer]**: 在每次创建新数据块前，用于快速扫描已创建的 data.js 内容，定位上次结束的位置和下一个待创建的句号

### MCP

- **[GitHub]**: 项目全部完成后，用于创建 GitHub 仓库并推送代码