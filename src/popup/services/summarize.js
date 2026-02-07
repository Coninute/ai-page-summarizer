export function mockSummarize(text, apiConfig, summaryLength) {
  let prefix = '';
  switch (apiConfig.contentType) {
    case 'blog':
      prefix = '[博客] ';
      break;
    case 'article':
      prefix = '[文章] ';
      break;
    case 'report':
      prefix = '[报告] ';
      break;
    case 'bulletpoints':
      prefix = '[要点] ';
      break;
    case 'summary':
    default:
      prefix = '[总结] ';
  }

  const rawTitle = text.substring(0, 200).replace(/\n/g, ' ').trim();
  const title = prefix + rawTitle;

  const summary = text.substring(0, summaryLength).replace(/\n/g, ' ').trim();

  const sentences = text.split(/[。！？.!?]/).filter((s) => s.trim().length > 10);
  const keyPoints = sentences.slice(0, 5).map((s) => s.trim());

  return {
    title,
    summary,
    keyPoints
  };
}

export function formatToMarkdown(summaryData, apiConfig) {
  let markdown = `# ${summaryData.title}\n\n`;

  let section1Title = '摘要';
  let section2Title = '要点';
  switch (apiConfig.contentType) {
    case 'blog':
      section1Title = '引言';
      section2Title = '正文';
      break;
    case 'article':
      section1Title = '摘要';
      section2Title = '正文';
      break;
    case 'report':
      section1Title = '执行摘要';
      section2Title = '主要发现';
      break;
    case 'bulletpoints':
      section1Title = '摘要';
      section2Title = '关键要点';
      break;
    case 'summary':
    default:
      section1Title = '摘要';
      section2Title = '要点';
  }

  markdown += `## ${section1Title}\n${summaryData.summary}\n\n`;
  markdown += `## ${section2Title}\n`;
  summaryData.keyPoints.forEach((point) => {
    markdown += `- ${point}\n`;
  });
  return markdown;
}

export async function callAPISummarize(text, apiConfig, summaryLength) {
  const contentType = apiConfig.contentType;

  let systemPrompt = '';
  switch (contentType) {
    case 'blog':
      systemPrompt = `你是一个专业的博客作者。请根据用户提供的文章内容，创作一篇结构完整的博客文章，包括吸引人的标题、引言、正文和结论。请使用 Markdown 格式输出，标题用 #，引言用 ## 引言，正文用 ## 正文，结论用 ## 结论。博客文章请控制在约${summaryLength}字左右。`;
      break;
    case 'article':
      systemPrompt = `你是一个专业的文章编辑。请根据用户提供的文章内容，重新组织并润色为一篇结构清晰的文章，包括标题、摘要、正文和总结。请使用 Markdown 格式输出，标题用 #，摘要用 ## 摘要，正文用 ## 正文，总结用 ## 总结。文章请控制在约${summaryLength}字左右。`;
      break;
    case 'report':
      systemPrompt = `你是一个专业的报告撰写者。请根据用户提供的文章内容，撰写一份结构严谨的报告，包括报告标题、执行摘要、主要发现和建议。请使用 Markdown 格式输出，标题用 #，执行摘要用 ## 执行摘要，主要发现用 ## 主要发现，建议用 ## 建议。报告请控制在约${summaryLength}字左右。`;
      break;
    case 'bulletpoints':
      systemPrompt = `你是一个专业的要点提炼师。请将用户提供的文章内容提炼为清晰的要点列表，包括一个概括性标题和多个关键要点。请使用 Markdown 格式输出，标题用 #，要点用 ## 要点，每个要点用 - 开头。要点列表请控制在约${summaryLength}字左右。`;
      break;
    case 'summary':
    default:
      systemPrompt = `你是一个专业的文章总结助手。请将用户提供的文章内容总结为结构化的格式，包括标题、摘要和要点列表。请使用 Markdown 格式输出，标题用 #，摘要用 ## 摘要，要点用 ## 要点，每个要点用 - 开头。总结的摘要部分请控制在约${summaryLength}字左右。`;
  }

  const requestBody = {
    model: apiConfig.model,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `请根据以下内容生成${
          contentType === 'summary'
            ? '总结'
            : contentType === 'blog'
            ? '博客文章'
            : contentType === 'article'
            ? '文章'
            : contentType === 'report'
            ? '报告'
            : '要点列表'
        }：\n\n${text.substring(0, 8000)}`
      }
    ],
    stream: false
  };

  if (apiConfig.enableThinking) {
    requestBody.extra_body = {
      enable_thinking: true
    };
  }

  const response = await fetch(apiConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiConfig.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error('API Key 无效或已失效，请检查设置中的 API Key');
    }
    throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('API 返回的数据格式不正确');
  }

  const choice = data.choices[0];
  const content = choice.message?.content || choice.delta?.content || '';

  const lines = content.split('\n');
  let title = '';
  let summary = '';
  const keyPoints = [];

  const sectionPatterns = {
    summary: ['## 摘要', '## Summary', '## 简介', '## 概述'],
    blog: ['## 引言', '## 正文', '## 内容', '## 主体', '## 结论', '## 结语'],
    article: ['## 摘要', '## 正文', '## 内容', '## 总结', '## 结论'],
    report: ['## 执行摘要', '## 主要发现', '## 关键发现', '## 建议', '## 结论'],
    bulletpoints: ['## 要点', '## 关键点', '## 关键要点', '## Key Points']
  };

  const patterns = sectionPatterns[contentType] || sectionPatterns.summary;

  let currentSection = '';
  let collectingContent = false;
  let summaryCollected = false;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('##')) {
      title = trimmedLine.replace('# ', '').trim();
    } else if (trimmedLine.startsWith('## ')) {
      const isSectionMatch = patterns.some((pattern) => trimmedLine.startsWith(pattern));

      if (isSectionMatch) {
        currentSection = trimmedLine.replace('## ', '').trim();
        collectingContent = true;

        if (
          (contentType === 'blog' && trimmedLine.startsWith('## 引言')) ||
          (contentType === 'article' && trimmedLine.startsWith('## 摘要')) ||
          (contentType === 'report' && trimmedLine.startsWith('## 执行摘要')) ||
          (contentType === 'summary' && trimmedLine.startsWith('## 摘要')) ||
          (contentType === 'bulletpoints' && trimmedLine.startsWith('## 摘要'))
        ) {
          summaryCollected = false;
        }
      } else {
        collectingContent = false;
      }
    } else if (collectingContent && trimmedLine) {
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        keyPoints.push(trimmedLine.replace(/^[-*]\s+/, '').trim());
      } else if (currentSection && !trimmedLine.startsWith('#') && !summaryCollected) {
        if (trimmedLine.length > 10) {
          summary += `${trimmedLine} `;
          if (summary.length > 300) {
            summaryCollected = true;
          }
        }
      }
    }
  });

  if (!title) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    title = titleMatch ? titleMatch[1].trim() : text.substring(0, 200).replace(/\n/g, ' ').trim();
  }

  if (!summary) {
    summary = content.substring(0, 1000).replace(/\n/g, ' ').trim();
  }

  let finalKeyPoints = keyPoints;
  if (keyPoints.length === 0) {
    const bulletMatches = content.match(/^[-*]\s+.+$/gm);
    if (bulletMatches && bulletMatches.length > 0) {
      finalKeyPoints = bulletMatches.slice(0, 5).map((item) => item.replace(/^[-*]\s+/, '').trim());
    } else {
      const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
      if (paragraphs.length > 0) {
        finalKeyPoints = paragraphs
          .slice(0, 3)
          .map((p) => `${p.substring(0, 150).trim()}...`);
      } else {
        finalKeyPoints = [content.substring(0, 300).trim()];
      }
    }
  }

  return {
    title,
    summary: summary.trim(),
    keyPoints: finalKeyPoints
  };
}

