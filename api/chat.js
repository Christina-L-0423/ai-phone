// api/chat.js
export default async function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '请使用 POST' });
  }

  const { action, baseUrl, apiKey, model, message } = req.body;

  if (!baseUrl || !apiKey) {
    return res.status(400).json({ error: '缺少 API 地址或 Key' });
  }

  // 拉取模型
  if (action === 'models') {
    try {
      const response = await fetch(baseUrl + '/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      return res.status(200).json({ models: data.data || [] });
    } catch (err) {
      return res.status(500).json({ error: '拉取模型失败' });
    }
  }

  // 聊天
  if (action === 'chat') {
    if (!model || !message) {
      return res.status(400).json({ error: '缺少模型或消息' });
    }
    try {
      const response = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000,
          stream: false
        })
      });
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return res.status(200).json({ reply: data.choices[0].message.content });
      } else {
        return res.status(500).json({ error: data.error?.message || 'AI 返回异常' });
      }
    } catch (err) {
      return res.status(500).json({ error: '服务器繁忙' });
    }
  }

  return res.status(400).json({ error: '未知动作' });
}